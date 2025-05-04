import { createSlice } from "@reduxjs/toolkit";

const regionSlice = createSlice({
  name: "region",
  initialState: {
    start: 0,
    end: 60,
    audio: {
      name: null,
      url: null,
    },
    metadata: {
      title: "",
      artist: "",
      album: "",
      publisher: "",
    },
  },
  reducers: {
    updateRegion: (state, action) => {
      state.start = action.payload.start;
      state.end = action.payload.end;
    },
    adjustStart: (state, action) => {
      state.start = Math.max(0, state.start + action.payload);
      if (state.end <= state.start) {
        state.end = state.start + 0.1;
      }
    },
    adjustEnd: (state, action) => {
      state.end = Math.max(state.start + 0.1, state.end + action.payload);
    },

    updateMetadata: (state, action) => {
      state.metadata = {
        ...state.metadata,
        ...action.payload,
      };
    },
    // setPreset: (state, action) => {
    //   state.metadata = action.payload;
    // },
    setPreset: (state, action) => {
      state.metadata = {
        ...state.metadata,
        ...action.payload
      };
    },
    setAudio: (state, action) => {
      const nameWithoutExtension = action.payload.name.replace(/\.[^/.]+$/, '');
      state.audio.name = action.payload.name;
      state.audio.url = action.payload.url;
      state.metadata.title = nameWithoutExtension;
    },
    clearAudio: (state) => {
      state.audio.file = null;
      state.audio.url = null;
    }
  },
});

export const {
  updateRegion,
  adjustStart,
  adjustEnd,
  updateMetadata,
  setPreset,
  setAudio,
  clearAudio,
} = regionSlice.actions;

export default regionSlice.reducer;
