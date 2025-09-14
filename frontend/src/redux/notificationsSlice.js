// src/redux/notificationsSlice.js
import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";

import {api} from "../redux/authSlice"; 

/** DB'den bildirimleri çek */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("notifications/");
      return data.map((n) => ({
        id: n.id, // DB id (int)
        type: n.type || "info",
        title: n.title,
        message: n.message,
        channel: n.channel || "header",
        read: !!n.read,
        createdAt: n.created_at, // ISO string
        objectId: n.object_id,
        contentType: n.content_type,
      }));
    } catch (err) {
      return rejectWithValue(
        (err && err.response && err.response.data) || "Bildirimler alınamadı"
      );
    }
  }
);

const initialState = {
  items: [],     // {id?, localId?, type, title, message, channel, read, createdAt, ...}
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /** Local (ör. ProductCreate sonrası) anında gösterilecek bildirim */
    addNotification: {
      reducer(state, action) {
        // en üste ekle
        state.items.unshift(action.payload);
      },
      prepare({ type = "info", title, message, channel = "header" }) {
        return {
          payload: {
            localId: nanoid(),     // DB id yoksa localId ile takip
            type,
            title,
            message,
            channel,
            read: false,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },

    /** Tek bildirimi okundu işaretle (id ya da localId kabul eder) */
    markAsRead(state, action) {
      const id = action.payload;
      const it = state.items.find(
        (n) => n.id === id || n.localId === id
      );
      if (it) it.read = true;
    },

    /** Kanal bazında hepsini okundu yap (varsayılan header) */
    markAllRead(state, action) {
      const channel = action.payload || "header";
      state.items.forEach((n) => {
        if ((n.channel || "header") === channel) n.read = true;
      });
    },

    /** Bildirimi listeden çıkar (id veya localId) */
    removeNotification(state, action) {
      const id = action.payload;
      state.items = state.items.filter(
        (n) => n.id !== id && n.localId !== id
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const serverItems = action.payload || [];
        const localItems = state.items.filter((n) => !n.id); // DB'de olmayan local bildirimleri koru
        // DB'den gelenler üstte olsun istersen sıralamayı burada değiştirebilirsin
        state.items = [...serverItems, ...localItems];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Bildirimler alınamadı";
      });
  },
});

export const {
  addNotification,
  markAsRead,
  markAllRead,
  removeNotification,
} = slice.actions;

/** Selectors */
export const selectAllNotifications = (state) => state.notifications.items;
export const selectHeaderNotifications = (state) =>
  state.notifications.items.filter((n) => (n.channel || "header") === "header");
export const selectUnreadHeaderCount = (state) =>
  state.notifications.items.filter(
    (n) => (n.channel || "header") === "header" && !n.read
  ).length;

export default slice.reducer;
