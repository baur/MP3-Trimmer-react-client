import React from "react";
import { useDispatch } from "react-redux";
import { setPreset } from "../../regionSlice";

// Коллекция пресетов
const presets = [
  {
    metadata: {
      artist: "Шейх Абу Яхья аль-Къирми",
      album: "Зикры и дуа",
      publisher: "islam.click",
    },
    cover: "/covers/cover1.jpg",
  },
  {
    metadata: {
      artist: "Шейх Мухаммад аль-Хасан",
      album: "Духовные наставления",
      publisher: "islam.click",
    },
    cover: "/covers/cover2.jpg",
  },
  {
    metadata: {
      artist: "Шейх Абдулла аль-Бухари",
      album: "Исламские лекции",
      publisher: "islam.click",
    },
    cover: "/covers/cover3.jpg",
  },
];

const PresetModal = ({ setCover, setIsPresetSelected, closeModal }) => {
  const dispatch = useDispatch();

  const selectPreset = async (preset) => {
    try {
      // Устанавливаем метаданные
      dispatch(setPreset(preset.metadata));
      // Загружаем обложку
      const response = await fetch(preset.cover);
      const blob = await response.blob();
      const file = new File([blob], `cover${presets.indexOf(preset) + 1}.jpg`, {
        type: blob.type,
      });
      setCover(file);
      setIsPresetSelected(true); // Указываем, что пресет выбран
      closeModal();
    } catch (error) {
      console.error("Ошибка загрузки пресета:", error);
    }
  };

  const clearPreset = () => {
    dispatch(setPreset({ artist: "", album: "", publisher: "" }));
    setCover(null);
    setIsPresetSelected(false); // Сбрасываем выбор пресета
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-lg w-full space-y-4">
        <h2 className="text-xl font-semibold">Выберите пресет</h2>
        <div className="grid grid-cols-1 gap-4">
          {presets.map((preset, index) => (
            <div
              key={index}
              className="flex items-center p-4 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => selectPreset(preset)}
            >
              <img
                src={preset.cover}
                alt={preset.metadata.album}
                className="w-16 h-16 object-cover rounded mr-4"
              />
              <div>
                <p className="font-semibold">{preset.metadata.album}</p>
                <p className="text-sm text-gray-600">{preset.metadata.artist}</p>
                <p className="text-sm text-gray-600">{preset.cover}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={clearPreset}
            className="btn-primary w-full mt-4"
          >
            Очистить пресет
          </button>
          <button
            onClick={closeModal}
            className="btn-primary w-full mt-4"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetModal;