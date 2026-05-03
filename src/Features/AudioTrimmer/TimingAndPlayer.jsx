import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adjustStart, adjustEnd } from "../../regionSlice";
import WavesurferPlayer from "./Player";

const TimingAndPlayer = () => {
  const fileURL = useSelector((state) => state.region.audio.url);
  const dispatch = useDispatch();
  const { start, end } = useSelector((state) => state.region);
  const [activeBoundary, setActiveBoundary] = useState("start");
  const [stepValue, setStepValue] = useState(1);

  const isEditingStart = activeBoundary === "start";
  const activeLabel = isEditingStart ? "Начало (сек)" : "Конец (сек)";
  const activeTime = isEditingStart ? start : end;
  const stepInSeconds = stepValue;
  const stepInMilliseconds = stepValue / 1000;
  const adjustActiveBoundary = (amount) => {
    dispatch(isEditingStart ? adjustStart(amount) : adjustEnd(amount));
  };

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


  if (!fileURL) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6 w-full full-width-section">
      <div className="flex flex-col gap-4 w-full items-center">
        <div className="inline-flex rounded border border-blue-500 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveBoundary("start")}
            className={`px-4 py-2 transition ${
              isEditingStart
                ? "bg-blue-500 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          >
            Начало
          </button>
          <button
            type="button"
            onClick={() => setActiveBoundary("end")}
            className={`px-4 py-2 transition ${
              !isEditingStart
                ? "bg-blue-500 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          >
            Конец
          </button>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-2">
          <label className="block font-semibold text-center w-full">
            Шаг: {stepValue} мс / {stepValue} сек
          </label>
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            value={stepValue}
            onChange={(e) => setStepValue(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="w-full flex flex-col items-center">
          <label className="block font-semibold mb-2 text-center w-full">
            {activeLabel}:
          </label>
          <div className="flex flex-wrap items-center gap-2 justify-center">
            <button
              type="button"
              onClick={() => adjustActiveBoundary(-stepInSeconds)}
              className="btn"
            >
              -{stepValue} сек
            </button>
            <button
              type="button"
              onClick={() => adjustActiveBoundary(-stepInMilliseconds)}
              className="btn"
            >
              -{stepValue} мс
            </button>
            <input
              type="text"
              value={formatTime(activeTime)}
              readOnly
              step="0.1"
              className="input w-28 text-center"
            />
            <button
              type="button"
              onClick={() => adjustActiveBoundary(stepInMilliseconds)}
              className="btn"
            >
              +{stepValue} мс
            </button>
            <button
              type="button"
              onClick={() => adjustActiveBoundary(stepInSeconds)}
              className="btn"
            >
              +{stepValue} сек
            </button>
          </div>
        </div>
      </div>

      {fileURL ? (
        <WavesurferPlayer key={fileURL} />
      ) : (
        <p className="text-red-500 text-center font-semibold">Выберите файл</p>
      )}
    </div>
  );
};

export default TimingAndPlayer;
