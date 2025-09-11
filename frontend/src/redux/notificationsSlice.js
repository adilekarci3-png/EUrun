// src/redux/notificationsSlice.js
import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import {api} from "../redux/authSlice"; 

// —— THUNK’LAR (DB ENTEGRASYONU) ——
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async () => {
    const { data } = await api.get("notifications/");
    // API -> state normalizasyonu (created_at -> createdAt)
    return data.map((n) => ({
      id: n.id,                                  // API id (sayı)
      type: n.type || "info",
      title: n.title,
      message: n.message,
      channel: n.channel || "header",
      read: !!n.read,
      createdAt: n.created_at,                   // ISO string
      // istersen object_id, content_type vs. de taşıyabilirsin
    }));
  }
);

export const markAllReadApi = createAsyncThunk(
  "notifications/markAllReadApi",
  async () => {
    await api.post("notifications/mark-all-read/");
    return true;
  }
);

export const markReadApi = createAsyncThunk(
  "notifications/markReadApi",
  async (id) => {
    await api.post(`notifications/${id}/mark-read/`);
    return id;
  }
);

// —— MEVCUT LOCAL YAPI + DB ENTEGRASYONU ——
const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],           // {id,type,title,message,read,createdAt,channel}
    loading: false,
    error: null,
  },
  reducers: {
    // Local ekleme (örn. optimistic UI / socket / özel kullanım)
    addNotification: {
      reducer(state, action) {
        state.items.unshift(action.payload); // en yeni en üstte
      },
      prepare({ type = "info", title, message, channel = "header" }) {
        return {
          payload: {
            id: nanoid(), // local id (string) — DB’den gelenler sayı olabilir
            type, title, message, channel,
            read: false,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    markAsRead(state, action) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllRead(state, action) {
      const channel = action?.payload || "header";
      state.items.forEach((n) => { if (n.channel === channel) n.read = true; });
    },
    removeNotification(state, action) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    clearChannel(state, action) {
      const channel = action?.payload || "header";
      state.items = state.items.filter((n) => n.channel !== channel);
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload; // DB’den gelen set
      })
      .addCase(fetchNotifications.rejected, (s, a) => {
        s.loading = false; s.error = a.error?.message || "Fetch failed";
      })
      // MARK ALL READ (DB)
      .addCase(markAllReadApi.fulfilled, (s) => {
        s.items.forEach((n) => { n.read = true; });
      })
      // MARK READ (DB)
      .addCase(markReadApi.fulfilled, (s, a) => {
        const it = s.items.find((n) => n.id === a.payload);
        if (it) it.read = true;
      });
  },
});

export const {
  addNotification,
  markAsRead,
  markAllRead,
  removeNotification,
  clearChannel,
} = notificationsSlice.actions;

// Seçiciler (Header için)
export const selectHeaderNotifications = (state) =>
  state.notifications.items.filter((n) => n.channel === "header");

export const selectUnreadHeaderCount = (state) =>
  state.notifications.items.filter((n) => n.channel === "header" && !n.read).length;

export default notificationsSlice.reducer;
