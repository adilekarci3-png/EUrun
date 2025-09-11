// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import auth from "../../redux/authSlice";

// Güvenli parse
function safeParse(json, fallback = undefined) {
  try { return JSON.parse(json); } catch { return fallback; }
}

// localStorage -> preloadedState
const raw = localStorage.getItem("auth");
const preloadedState = raw ? { auth: safeParse(raw) } : undefined;

// Storea
export const store = configureStore({
  reducer: { auth },
  preloadedState,
});

// Store değişince sadece auth'u kaydet
let lastAuth = store.getState().auth;
store.subscribe(() => {
  const state = store.getState();
  if (state.auth !== lastAuth) {
    lastAuth = state.auth;
    // İstersen yalnızca bazı alanları yaz (token, user vs.)
    localStorage.setItem("auth", JSON.stringify(state.auth));
  }
});

// Rehydrate sonrası axios Authorization başlığını ayarla (opsiyonel)
export function applyAuthHeaderOnBoot(setAuthHeader) {
  const token = store.getState()?.auth?.access;
  if (token) setAuthHeader(token);
}
