import React, { useState, useRef, useEffect, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import { updateRegion } from "../../regionSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import throttle from "lodash/throttle";

const ZOOM_MODES = {
  smooth: {
    label: "Плавно",
    max: 12.5,
  },
  normal: {
    label: "Средне",
    max: 18.75,
  },
  fast: {
    label: "Быстро",
    max: 25,
  },
};

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
  const [error, setError] = useState(null);

  const [zoomLevel, setZoomLevel] = useState(0);
  const [zoomMode, setZoomMode] = useState("normal");
  const [isZoomLocked, setIsZoomLocked] = useState(true);
  const zoomMax = ZOOM_MODES[zoomMode].max;

  const waveformRef = useRef(null);
  const regionRef = useRef(null);
  const reduxRegionRef = useRef({ start, end });
  const isDraggingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const shouldStopAtEndRef = useRef(false); // Флаг для контроля остановки
  const isZoomLockedRef = useRef(true);

  useEffect(() => {
    reduxRegionRef.current = { start, end };
  }, [start, end]);

  useEffect(() => {
    isZoomLockedRef.current = isZoomLocked;
  }, [isZoomLocked]);

  const getActualRegionBounds = useCallback(() => {
    return {
      start: regionRef.current ? regionRef.current.start : reduxRegionRef.current.start,
      end: regionRef.current ? regionRef.current.end : reduxRegionRef.current.end,
    };
  }, []);

  const isTimeInsideRegion = useCallback((time, regionStart, regionEnd) => {
    return time >= regionStart && time < regionEnd;
  }, []);

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

  console.log("=== useEffect STARTED ===", { fileURL, hasRef: !!waveformRef.current });


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
    const zoomOnWheel = zoom.onWheel.bind(zoom);
    const zoomOnTouchStart = zoom.onTouchStart.bind(zoom);
    const zoomOnTouchMove = zoom.onTouchMove.bind(zoom);

    zoom.onWheel = (event) => {
      if (!isZoomLockedRef.current) {
        zoomOnWheel(event);
      }
    };
    zoom.onTouchStart = (event) => {
      if (!isZoomLockedRef.current) {
        zoomOnTouchStart(event);
      }
    };
    zoom.onTouchMove = (event) => {
      if (!isZoomLockedRef.current) {
        zoomOnTouchMove(event);
      }
    };

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
      backend: "WebAudio",
      //  backend: "MediaElement", 
      responsive: true,
      fillParent: true,
      // barWidth: 2, // Добавьте - уменьшает детализацию
      // barGap: 1, // Добавьте
      // minPxPerSec: 1, // Добавьте - начальный зум для больших файлов


    });

    // Обработчики событий
    ws.on("loading", (percent) => {
      setLoadingPercent(percent);
      if (percent === 100) {
        updateStatus(
          "Идет декодирование... (может занять время для больших файлов)"
        );
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
      const { end: actualRegionEnd } = getActualRegionBounds();

      // Останавливаем воспроизведение только когда достигли конца региона
      // И только если включен флаг остановки
      if (
        shouldStopAtEndRef.current &&
        isPlayingRef.current &&
        currentTime >= actualRegionEnd
      ) {
        ws.pause();
        shouldStopAtEndRef.current = false; // Сбрасываем флаг
      }
    });

    ws.on("interaction", (newTime) => {
      const { start: actualStart, end: actualEnd } = getActualRegionBounds();

      if (
        isPlayingRef.current &&
        !isTimeInsideRegion(newTime, actualStart, actualEnd)
      ) {
        shouldStopAtEndRef.current = true;
        ws.play(actualStart, actualEnd);
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
  }, [fileURL, dispatch, getActualRegionBounds, isTimeInsideRegion]);

  // Синхронизация региона с Redux
  useEffect(() => {
      console.log("=== Sync region useEffect ===", { start, end, hasWavesurfer: !!wavesurfer, isDragging: isDraggingRef.current });

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
      console.log("=== Cleanup fileURL useEffect ===", { fileURL });

    console.log("fileURL from Redux:", fileURL);
    return () => {
      if (fileURL) {
        console.log("Cleaning up fileURL:", fileURL);
        URL.revokeObjectURL(fileURL);
      }
    };
  }, [fileURL]);

  const onPlayPause = () => {
    if (!wavesurfer) return;

    if (isPlaying) {
      // Если играет - просто ставим на паузу
      wavesurfer.pause();
      shouldStopAtEndRef.current = false; // Сбрасываем флаг при ручной паузе
      return;
    }

    const current = wavesurfer.getCurrentTime();

    const { start: actualStart, end: actualEnd } = getActualRegionBounds();

    // Проверяем, находится ли курсор внутри региона
    const isInsideRegion = isTimeInsideRegion(current, actualStart, actualEnd);

    // Устанавливаем флаг остановки в конце региона
    shouldStopAtEndRef.current = true;

    if (isInsideRegion) {
      // Курсор внутри региона - начинаем с текущей позиции
      wavesurfer.play(current, actualEnd);
    } else {
      // Курсор вне региона - начинаем с начала региона
      wavesurfer.play(actualStart, actualEnd);
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

  const handleZoom = useMemo(
    () => throttle((e) => {
      const minPxPerSec = e.target.valueAsNumber;
      if (wavesurfer) {
        wavesurfer.zoom(minPxPerSec);
      }
    }, 50), // Задержка 50мс для плавности
    [wavesurfer]
  );

  const handleZoomModeChange = (mode) => {
    const nextMax = ZOOM_MODES[mode].max;

    setZoomMode(mode);

    if (wavesurfer && zoomLevel > nextMax) {
      wavesurfer.zoom(nextMax);
      setZoomLevel(nextMax);
    }
  };

  useEffect(() => {
    return () => {
      handleZoom.cancel();
    };
  }, [handleZoom]);

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
        <div ref={waveformRef} style={{ width: "100%" }} />
      ) : (
        <p>Файл не загружен</p>
      )}

      {!isLoading ? (
        <>
          <p>Текущее время: {formatTime(currentTime)}</p>
          <p>
            Длина отрезка:{" "}
            {formatTime(
              regionRef.current
                ? regionRef.current.end - regionRef.current.start
                : end - start
            )}
          </p>
          <p>
            Регион:{" "}
            {formatTime(regionRef.current ? regionRef.current.start : start)} -{" "}
            {formatTime(regionRef.current ? regionRef.current.end : end)}
          </p>
          <button className="btn" onClick={onPlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          {/* <button className="btn mr-2" onClick={selectAll}>
            Выбрать всё
          </button> */}
          <section className="mt-4 w-full rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <h3 className="mb-3 text-center text-base font-semibold text-blue-900">
              Зум
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <div className="w-full text-center font-medium text-blue-900 sm:w-auto sm:text-left">
                {Math.round(zoomLevel)} px/sec
              </div>
              <button
                type="button"
                className="btn w-full sm:w-auto"
                onClick={resetZoom}
              >
                Сбросить зум
              </button>
              <button
                type="button"
                className="btn w-full sm:w-auto"
                onClick={() => setIsZoomLocked((locked) => !locked)}
              >
                {isZoomLocked ? "Разблокировать зум" : "Блокировать зум"}
              </button>
              <div
                className="grid w-full grid-cols-3 overflow-hidden rounded border border-blue-500 sm:w-auto"
              >
                {Object.entries(ZOOM_MODES).map(([mode, config]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleZoomModeChange(mode)}
                    disabled={isZoomLocked}
                    className={`px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      zoomMode === mode
                        ? "bg-blue-500 text-white"
                        : "bg-white text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0"
                max={zoomMax}
                step="0.1"
                value={zoomLevel}
                onChange={handleZoom}
                disabled={isZoomLocked}
                className="w-full accent-blue-500 sm:max-w-xs"
              />
            </div>
          </section>
        </>
      ) : null}
    </>
  );
};

export default Player;
