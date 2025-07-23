import React, { useState } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import { useSelector } from "react-redux";

const Wavesurfer = () => {
  const fileURL = useSelector((state) => state.region.audio.url);
  const [wavesurfer, setWavesurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const onReady = (ws) => {
    setWavesurfer(ws);
    setIsPlaying(false);
  };

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

  const onError = (ws, err) => {
    alert("Ошибка: " + err);
    console.error("Wavesurfer error:", err);
  };

  return (
    <>
      <WavesurferPlayer
        height={100}
        waveColor="violet"
        onError={onError}
        url={fileURL}
        onReady={onReady}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <button onClick={onPlayPause}>{isPlaying ? "Pause" : "Play"}</button>
    </>
  );
};

export default Wavesurfer;
