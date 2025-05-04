import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAudio } from '../../regionSlice';
import axios from 'axios';

const AudioFileSelector = ({ onSelect }) => {
  const fileName = useSelector((state) => state.region.audio.name);
  const dispatch = useDispatch();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('audio/')) {
      alert('Неподдерживаемый формат файла');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      const { url } = response.data;
      dispatch(setAudio({ name: file.name, url }));
      onSelect(file);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка загрузки файла: ' + (error.response?.data || error.message));
    }
  };

  const openFileDialog = () => {
    document.getElementById('audio-upload-input').click();
  };

  return (
    <div className="text-gray-800 p-6 container">
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="w-full">
          <label className="block font-semibold mb-2">Аудиофайл:</label>
          <div className="relative">
            <button
              type="button"
              onClick={openFileDialog}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md w-full"
            >
              Выбрать аудиофайл
            </button>
            <input
              id="audio-upload-input"
              type="file"
              accept="audio/mpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {fileName && (
            <p className="mt-2 text-gray-700 text-sm">Выбран файл: {fileName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioFileSelector;