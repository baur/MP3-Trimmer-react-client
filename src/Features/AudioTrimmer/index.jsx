import React from "react";
import AudioFileSelector from "./AudioFileSelector";
import TimingAndPlayer from "./TimingAndPlayer";
import MetadataForm from "./MetadataForm";

function AudioTrimmer() {
  const [file, setFile] = React.useState(null);
  const handleFileSelect = (file) => {
   setFile(file);
   };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      {/* Секция 1 - Выбор файла */}
      <AudioFileSelector onSelect={handleFileSelect}/>
      {/* Секция 2 - Установка таймингов и плеер */}
      <TimingAndPlayer/>
      {/* Секция 3 - Метаданные и кнопка отправки */}
      <MetadataForm file={file}/>
    </div>
  );
}

export default AudioTrimmer;
