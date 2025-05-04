import React, { useState, useMemo, useRef, useEffect } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { updateRegion } from "../../regionSlice";
import { useDispatch, useSelector } from "react-redux";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";

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
  const regionRef = useRef(null);
  const isDraggingRef = useRef(false);

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

  const onReady = (ws) => {
    updateStatus("Инициализация Wavesurfer...");
    setWavesurfer(ws);
    ws.zoom(0);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    // setLoadingPercent(100);

    updateStatus("Регистрация плагина Regions...");
    const regions = ws.registerPlugin(RegionsPlugin.create());
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
      // Обновляем стили региона при ручном изменении
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
  };

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

  const onPlayPause = () => {
    if (wavesurfer) {
      const current = wavesurfer.getCurrentTime();
      if (current >= start && current <= end) {
        if (isPlaying) {
          wavesurfer.pause();
        } else {
          wavesurfer.play();
        }
      } else {
        wavesurfer.seekTo(start / wavesurfer.getDuration());
        wavesurfer.play();
      }
    }
  };

  const onTimeUpdate = () => {
    if (wavesurfer) {
      const current = wavesurfer.getCurrentTime();
      setCurrentTime(current);
      if (current >= end && isPlaying) {
        wavesurfer.pause();
        setIsPlaying(false);
      }
    }
  };

  const onError = (Wavesurfer, err) => {
    setIsLoading(false);
    setError(`Ошибка: ${err}`);
    
    console.error("Wavesurfer error:", err);
  };

  // const handleZoom = (e) => {
  //   const minPxPerSec = e.target.valueAsNumber;
  //   if (wavesurfer) {
  //     wavesurfer.zoom(minPxPerSec);
  //   }
  // };

  const resetZoom = () => {
    if (wavesurfer) {
      wavesurfer.zoom(0);
    }
  };

  useEffect(() => {
    console.log("fileURL from Redux:", fileURL);
    return () => {
      if (fileURL) {
        console.log("Cleaning up fileURL:", fileURL);
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [fileURL]);

  
  // const topTimeline = Timeline.create({
  //   height: 20,
  //   insertPosition: 'beforebegin',
  //   timeInterval: 30,
  //   primaryLabelInterval: 5,
  //   secondaryLabelInterval: 1,
  //   style: {
  //     fontSize: '10px',
  //     color: '#2D5B88',
  //   },
  // })

  // Create a second timeline
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
  return (
    <>
      {isLoading ? (
        <>
          <div className="loading">Загрузка... {loadingPercent}%</div>
          <div className="status">{status}</div>
        </>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
      {fileURL ? (
        <WavesurferPlayer
          height={100}
          // mediaControls={true}
          waveColor="#ddd"
          url={fileURL}
          onError={onError}
          onReady={onReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeupdate={onTimeUpdate}
          onLoading={(wavesurfer, percent) => {
            setLoadingPercent(percent);
          }}
          plugins={useMemo(
            () => [
              // Timeline.create(),
              // topTimeline,
              bottomTimeline,
              RegionsPlugin.create(),
              ZoomPlugin.create({
                scale: 0.1,
                maxZoom: 100,
              }),
            ],
            []
          )}
          progressColor="#4f46e5"
        />
      ) : (
        <p>Файл не загружен</p>
      )}

      {!isLoading ? (
        <>
          <p>Текущее время: {formatTime(currentTime)}</p>
          <p>Длина отрезка: {formatTime(end - start)}</p>
          <button className="btn mr-2" onClick={onPlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button className="btn mr-2" onClick={selectAll}>
            Выбрать всё
          </button>
          <button className="btn mr-2" onClick={resetZoom}>
            Сбросить зум
          </button>
        </>
      ) : null}
    </>
  );
};

export default Player;
