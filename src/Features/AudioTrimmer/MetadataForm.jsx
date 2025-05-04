import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateMetadata } from "../../regionSlice";
import PresetModal from "./PresetModal";
import axios from "axios";

const MetadataForm = () => {
  const dispatch = useDispatch();
  const { start, end, metadata, audio } = useSelector((state) => state.region);
  const [cover, setCover] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetSelected, setIsPresetSelected] = useState(false);

  const onChangeField = (field) => (e) => {
    dispatch(updateMetadata({ [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audio.url) return alert("Выберите файл");
    if (end <= start) return alert("Конечное время должно быть больше начального");
    if (!cover) return alert("Выберите обложку!");

    const guid = audio.url.split("/").pop(); // Извлекаем GUID из URL
    const formData = new FormData();
    formData.append("guid", guid);
    formData.append("start", start);
    formData.append("end", end);
    formData.append("title", metadata.title);
    formData.append("artist", metadata.artist);
    formData.append("album", metadata.album);
    formData.append("publisher", metadata.publisher);
    if (cover) formData.append("cover", cover);

    try {
      const response = await axios.post("http://localhost:5000/trim", formData, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "trimmed.mp3");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Ошибка Axios:", error);
      alert("Ошибка обработки: " + (error.response?.data || error.message));
    }
  };

  if (!audio.url) return null;

  return (
    <div className="text-gray-800 p-6 container">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-full mx-auto">
          <div>
            <label className="block font-semibold mb-2">Название:</label>
            <input
              type="text"
              value={metadata.title}
              onChange={onChangeField("title")}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Исполнитель:</label>
            <input
              type="text"
              value={metadata.artist}
              onChange={onChangeField("artist")}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Альбом:</label>
            <input
              type="text"
              value={metadata.album}
              onChange={onChangeField("album")}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Издатель:</label>
            <input
              type="text"
              value={metadata.publisher}
              onChange={onChangeField("publisher")}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Обложка:</label>
            {!isPresetSelected && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCover(e.target.files[0]);
                  setIsPresetSelected(false);
                }}
                className="input w-full"
              />
            )}
            {cover && (
              <div className="mt-4 text-center">
                <p className="font-semibold mb-2">Предпросмотр обложки:</p>
                <div className="flex justify-center">
                  <img
                    src={URL.createObjectURL(cover)}
                    alt="Обложка"
                    className="max-w-xs rounded shadow"
                  />
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full mb-4"
          >
            Выбрать пресет
          </button>
          <button type="submit" className="btn-primary w-full">
            Обрезать и тегировать
          </button>
        </form>
      </div>
      {isModalOpen && (
        <PresetModal
          setCover={setCover}
          setIsPresetSelected={setIsPresetSelected}
          closeModal={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MetadataForm;