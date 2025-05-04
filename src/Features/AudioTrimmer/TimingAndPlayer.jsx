import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { adjustStart, adjustEnd } from "../../regionSlice";
import WavesurferPlayer from "./Player";


const TimingAndPlayer = () => {
  const fileURL = useSelector((state) => state.region.audio.url);
    const dispatch = useDispatch();
  const { start, end } = useSelector((state) => state.region);
  const decreaseStart = () => dispatch(adjustStart(-1));
  const increaseStart = () => dispatch(adjustStart(1));
  const decreaseEnd = () => dispatch(adjustEnd(-1));
  const increaseEnd = () => dispatch(adjustEnd(1));
  const decreaseStartMs = () => dispatch(adjustStart(-0.1));
  const increaseStartMs = () => dispatch(adjustStart(0.1));
  const decreaseEndMs = () => dispatch(adjustEnd(-0.1));
  const increaseEndMs = () => dispatch(adjustEnd(0.1));

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
      <div className="flex flex-col md:flex-row md:justify-between gap-4 w-full items-center md:items-stretch">
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
          <label className="block font-semibold mb-2 text-center md:text-left w-full">
            Начало (сек):
          </label>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <button type="button" onClick={decreaseStart} className="btn">
              -1 сек
            </button>
            <button type="button" onClick={decreaseStartMs} className="btn">
              -100 мс
            </button>
            <input
              type="text"
              value={formatTime(start)}
              readOnly
              step="0.1"
              className="input w-28 text-center"
            />
            <button type="button" onClick={increaseStartMs} className="btn">
              +100 мс
            </button>
            <button type="button" onClick={increaseStart} className="btn">
              +1 сек
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center md:items-end">
          <label className="block font-semibold mb-2 text-center md:text-right w-full">
            Конец (сек):
          </label>
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <button type="button" onClick={decreaseEnd} className="btn">
              -1 сек
            </button>
            <button type="button" onClick={decreaseEndMs} className="btn">
              -100 мс
            </button>
            <input
              type="text"
              value={formatTime(end)}
              readOnly
              step="0.1"
              className="input w-28 text-center"
            />
            <button type="button" onClick={increaseEndMs} className="btn">
              +100 мс
            </button>
            <button type="button" onClick={increaseEnd} className="btn">
              +1 сек
            </button>
          </div>
        </div>
      </div>

      {fileURL ? (
        <WavesurferPlayer key={fileURL}/> 
      ) : (
        <p className="text-red-500 text-center font-semibold">Выберите файл</p>
      )}
    </div>
  );
};

export default TimingAndPlayer;
