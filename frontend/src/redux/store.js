// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import authReducer from "./authSlice";
import favoritesReducer from "./favoritesSlice";
import notificationsReducer from "./notificationsSlice"; // ✅ EKLE

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer, // ✅ Burada kullan
  },
});