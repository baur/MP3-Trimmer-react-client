import React, { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import { updateRegion } from "../../regionSlice";
import { useDispatch, useSelector } from "react-redux";
import {  useCallback } from "react";
import throttle from 'lodash/throttle';

const Player = () => {
  const dispatch = useDispatch();
  const { start, end } = useSelector((state) => state.region);
  const fileURL = useSelector((state) => state.region.audio.url);
  
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [status, setStatus] = useState("");
  const [wavesurfer, setWavesurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const [zoomLevel, setZoomLevel] = useState(0);
  
  const waveformRef = useRef(null);
  const regionRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const shouldStopAtEndRef = useRef(false); // Флаг для контроля остановки

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000)
      .toString()
      .padStart(3, "0");
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const updateStatus = (message) => {
    setStatus(message);
    console.log(`Статус: ${message}`);
  };

  // Инициализация WaveSurfer
  useEffect(() => {
    if (!fileURL || !waveformRef.current) return;

    updateStatus("Инициализация Wavesurfer...");
    setIsLoading(true);
    setError(null);

    // Создание Timeline плагина
    const bottomTimeline = Timeline.create({
      height: 15,
      timeInterval: 60,
      primaryLabelInterval: 5,
      secondaryLabelInterval: 1,
      style: {
        fontSize: "10px",
        color: "#2D5B88",
      },
    });

    // Создание Regions плагина
    const regions = RegionsPlugin.create();

    // Создание Zoom плагина
    const zoom = ZoomPlugin.create({
      scale: 0.1,
      maxZoom: 25,
    });

    // Инициализация WaveSurfer
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 100,
      waveColor: "#ddd",
      progressColor: "#4f46e5",
      plugins: [bottomTimeline, regions, zoom],
      interact: true,
      hideScrollbar: true,
      normalize: false,
      backend: 'WebAudio',
      responsive: true,
      fillParent: true,
    });

    // Обработчики событий
    ws.on("loading", (percent) => {
      setLoadingPercent(percent);
      if (percent === 100) {
        updateStatus("Идет декодирование...");
      }
    });

    ws.on("decode", (duration) => {
      updateStatus("Декодирование завершено: " + duration);
    });

    ws.on("ready", () => {
      updateStatus("Инициализация Wavesurfer...");
      ws.zoom(0);
      setIsPlaying(false);
      setIsLoading(false);
      setError(null);

      updateStatus("Получение длительности аудио...");
      const audioDuration = ws.getDuration();
      setDuration(audioDuration);
      
      updateStatus("Создание региона...");
      const regionLength = 60;
      let startTime, endTime;

      if (audioDuration < regionLength) {
        startTime = 0;
        endTime = audioDuration;
      } else {
        startTime = (audioDuration - regionLength) / 2;
        endTime = startTime + regionLength;
      }

      const region = regions.addRegion({
        start: startTime,
        end: endTime,
        color: "rgba(79, 70, 229, 0.2)",
        drag: true,
        resize: true,
      });

      regionRef.current = region;
      
      updateStatus("Обновление Redux...");
      dispatch(
        updateRegion({
          start: startTime,
          end: endTime,
        })
      );

      // Отслеживаем ручное изменение региона
      updateStatus("Настройка обработчиков региона...");
      region.on("update", () => {
        isDraggingRef.current = true;
        const duration = ws.getDuration();
        if (duration) {
          region.element.style.left = `${(region.start / duration) * 100}%`;
          region.element.style.width = `${
            ((region.end - region.start) / duration) * 100
          }%`;
        }
      });

      region.on("update-end", () => {
        isDraggingRef.current = false;
        dispatch(
          updateRegion({
            start: region.start,
            end: region.end,
          })
        );
      });
      
      updateStatus("Готово!");
    });

    ws.on("play", () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
    });
    
    ws.on("pause", () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    });

    ws.on("timeupdate", (currentTime) => {
      setCurrentTime(currentTime);
      
      // Получаем актуальные границы региона из WaveSurfer, а не из Redux
      const actualRegionEnd = regionRef.current ? regionRef.current.end : end;
      
      // Останавливаем воспроизведение только когда достигли конца региона
      // И только если включен флаг остановки
      if (shouldStopAtEndRef.current && isPlayingRef.current && currentTime >= actualRegionEnd) {
        ws.pause();
        shouldStopAtEndRef.current = false; // Сбрасываем флаг
      }
    });

    ws.on("zoom", (minPxPerSec) => {
      console.log("Zoom changed:", minPxPerSec);
      setZoomLevel(minPxPerSec);
    });

    ws.on("error", (err) => {
      setIsLoading(false);
      setError(`Ошибка: ${err}`);
      console.error("Wavesurfer error:", err);
    });

    // Загружаем аудио
    ws.load(fileURL);
    setWavesurfer(ws);

    // Cleanup функция
    return () => {
      if (ws) {
        ws.destroy();
      }
    };
  }, [fileURL]);

  // Синхронизация региона с Redux
  useEffect(() => {
    if (
      regionRef.current &&
      wavesurfer &&
      !isDraggingRef.current &&
      (start !== regionRef.current?.start || end !== regionRef.current?.end)
    ) {
      regionRef.current.start = start || 2;
      regionRef.current.end = end || 5;
      // Обновляем отображение региона
      const duration = wavesurfer.getDuration();
      if (duration) {
        regionRef.current.element.style.left = `${
          (regionRef.current.start / duration) * 100
        }%`;
        regionRef.current.element.style.width = `${
          ((regionRef.current.end - regionRef.current.start) / duration) * 100
        }%`;
      }
    }
  }, [start, end, wavesurfer]);

  // Cleanup для fileURL
  useEffect(() => {
    console.log("fileURL from Redux:", fileURL);
    return () => {
      if (fileURL) {
        console.log("Cleaning up fileURL:", fileURL);
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [fileURL]);

  const selectAll = () => {
    console.log("selectAll");
    if (!wavesurfer) return;
    dispatch(
      updateRegion({
        start: 0,
        end: duration,
      })
    );
  };

  const onPlayPause = () => {
    if (!wavesurfer) return;
    
    if (isPlaying) {
      // Если играет - просто ставим на паузу
      wavesurfer.pause();
      shouldStopAtEndRef.current = false; // Сбрасываем флаг при ручной паузе
      return;
    }

    const current = wavesurfer.getCurrentTime();
    const totalDuration = wavesurfer.getDuration();
    
    // Получаем актуальные границы региона из WaveSurfer
    const actualStart = regionRef.current ? regionRef.current.start : start;
    const actualEnd = regionRef.current ? regionRef.current.end : end;
    
    // Проверяем, находится ли курсор внутри региона
    const isInsideRegion = current >= actualStart && current < actualEnd;
    
    // Устанавливаем флаг остановки в конце региона
    shouldStopAtEndRef.current = true;
    
    if (isInsideRegion) {
      // Курсор внутри региона - начинаем с текущей позиции
      wavesurfer.play();
    } else {
      // Курсор вне региона - переходим к началу региона
      // Сначала останавливаем воспроизведение
      wavesurfer.pause();
      
      // Выполняем переход к началу региона
      wavesurfer.seekTo(actualStart / totalDuration);
      
      // Используем setTimeout для гарантии, что seekTo завершился
      setTimeout(() => {
        wavesurfer.play();
      }, 100);
    }
  };

  // const handleZoom = (e) => {
  //   const minPxPerSec = e.target.valueAsNumber;
  //   if (wavesurfer) {
  //     wavesurfer.zoom(minPxPerSec);
  //   }
  // };

  // const handleZoom = useCallback(
  //   React.useThrottledCallback((e) => {
  //     const minPxPerSec = e.target.valueAsNumber;
  //     if (wavesurfer) {
  //       wavesurfer.zoom(minPxPerSec);
  //     }
  //   }, 50), // Задержка 50мс для плавности
  //   [wavesurfer]
  // );

const handleZoom = useCallback(
    throttle((e) => {
      const minPxPerSec = e.target.valueAsNumber;
      if (wavesurfer) {
        wavesurfer.zoom(minPxPerSec);
      }
    }, 50), // Задержка 50мс для плавности
    [wavesurfer]
  );

  const resetZoom = () => {
    if (wavesurfer) {
      wavesurfer.zoom(0);
      setZoomLevel(0);
    }
  };

  return (
    <>
      {isLoading ? (
        <>
          {loadingPercent > 0 && loadingPercent < 100 ? (
            <div className="loading">Загрузка... {loadingPercent}%</div>
          ) : null}
          <div className="status">{status}</div>
        </>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
      
      {fileURL ? (
        <div ref={waveformRef} style={{ width: '100%' }} />
      ) : (
        <p>Файл не загружен</p>
      )}

      {!isLoading ? (
        <>
          <p>Текущее время: {formatTime(currentTime)}</p>
          <p>Длина отрезка: {formatTime((regionRef.current ? regionRef.current.end - regionRef.current.start : end - start))}</p>
          <p>Регион: {formatTime(regionRef.current ? regionRef.current.start : start)} - {formatTime(regionRef.current ? regionRef.current.end : end)}</p>
          <button className="btn mr-2" onClick={onPlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          {/* <button className="btn mr-2" onClick={selectAll}>
            Выбрать всё
          </button> */}
          <button className="btn mr-2" onClick={resetZoom}>
            Сбросить зум
          </button>
          <div style={{ marginTop: '10px' }}>
            <label>Зум: {Math.round(zoomLevel)} px/sec </label>
            <input
              type="range"
              min="0"
              max="25"
              step="0.1"
              value={zoomLevel}
              onChange={handleZoom}
              style={{ width: '200px', marginLeft: '10px' }}
            />
          </div>
        </>
      ) : null}
    </>
  );
};

export default Player;