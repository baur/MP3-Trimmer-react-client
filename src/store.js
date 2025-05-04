import { configureStore } from "@reduxjs/toolkit";
import regionReducer from "./regionSlice";

export const store = configureStore({
  reducer: {
    region: regionReducer,
  },
});