
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {api} from "../redux/authSlice"; 

const LS_KEY = "guest_favorites";
const readGuest = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // Normalize
    return Array.isArray(arr)
      ? arr
          .filter(Boolean)
          .map((it) => ({
            product_id: Number(it.product_id ?? it?.product?.id),
            product: it.product,
            favorited: true,
          }))
          .filter((x) => !!x.product_id)
      : [];
  } catch {
    return [];
  }
};
const writeGuest = (items) =>
  localStorage.setItem(
    LS_KEY,
    JSON.stringify(
      items.map((it) => ({
        product_id: it.product_id,
        product: it.product,
      }))
    )
  );
const addGuestItem = ({ product_id, product }) => {
  const items = readGuest();
  if (!items.some((x) => x.product_id === product_id)) {
    items.push({ product_id, product, favorited: true });
    writeGuest(items);
  }
  return items;
};
const removeGuestItem = (product_id) => {
  const items = readGuest().filter((x) => x.product_id !== product_id);
  writeGuest(items);
  return items;
};
const clearGuest = () => writeGuest([]);


export const addFavorite = createAsyncThunk(
  "favorites/add", 
  async ({ product_id, product }, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      const items = addGuestItem({ product_id, product });
      return { mode: "guest", items };
    }
    try {      
      const { data } = await api.post(`/products/${product_id}/favorite/`);      
      const serverItem = {
        product_id,
        product: data?.product,
        favorited: true,
      };
      return { mode: "server", item: serverItem };
    } catch (e) {
      return rejectWithValue(
        e?.response?.data || { detail: "Favoriye eklenemedi" }
      );
    }
  }
);

export const removeFavorite = createAsyncThunk(
  "favorites/remove",
  async ({ product_id }, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      const items = removeGuestItem(product_id);
      return { mode: "guest", items };
    }
    try {
      await api.delete(`/products/${product_id}/favorite/`);
      return { mode: "server", product_id };
    } catch (e) {
      return rejectWithValue(
        e?.response?.data || { detail: "Favoriden çıkarılamadı" }
      );
    }
  }
);


export const syncGuestFavorites = createAsyncThunk(
  "favorites/syncGuest",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) return { done: false };

    const guestItems = readGuest();
    if (!guestItems.length) return { done: true };

    try {      
      for (const gi of guestItems) {
        await api.post(`/products/${gi.product_id}/favorite/`);
      }
      clearGuest();
      await dispatch(fetchFavorites());
      return { done: true };
    } catch (e) {
      return rejectWithValue(
        e?.response?.data || { detail: "Guest favoriler merge edilemedi" }
      );
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  "favorites/fetch",
  async (productIds, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      return { mode: "guest", items: readGuest() };
    }
    try {     
      const ids = Array.isArray(productIds) ? productIds : [];
      if (!ids.length) {        
        return { mode: "server", items: null };
      }
      const checks = await Promise.all(
        ids.map(async (pid) => {
          const { data } = await api.get(`/products/${pid}/is-favorited/`);
          return { product_id: pid, favorited: data?.favorited === true };
        })
      );
      const items = checks.filter((c) => c.favorited);
      return { mode: "server", items };
    } catch (e) {
      return rejectWithValue(
        e?.response?.data || { detail: "Favoriler alınamadı" }
      );
    }
  }
);

const initialState = {
  mode: "guest", // "guest" | "server"
  items: [], // { product_id, product?, favorited: true }
  loading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {   
    resetFavorites(state) {
      state.mode = "guest";
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.mode = action.payload.mode;
        // normalize & dedupe by product_id
        if (action.payload.items === null) {
   // Mevcut state'i koru (server modda kontrol edilecek id verilmemiş)
   return;
 }
 const map = new Map();
 (action.payload.items || []).forEach((it) => {
   const pid = it.product_id ?? it.product?.id;
   if (!pid) return;
   map.set(String(pid), {
     product_id: pid,
     product: it.product,
     favorited: it.favorited ?? true,
   });
 });
 state.items = Array.from(map.values());
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      });

    // add
    builder
      .addCase(addFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.mode = action.payload.mode;
        if (action.payload.mode === "guest") {
          state.items = action.payload.items; // zaten LS normalize edilmiş
          return;
        }
        const it = action.payload.item;
        const pid = it.product_id ?? it.product?.id;
        if (!pid) return;
        const exists = state.items.some((x) => x.product_id === pid);
        if (!exists) {
          state.items.push({
            product_id: pid,
            product: it.product,
            favorited: true,
          });
        } else {
          state.items = state.items.map((x) =>
            x.product_id === pid ? { ...x, favorited: true, product: it.product ?? x.product } : x
          );
        }
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload || action.error;
      });

    // remove
    builder
      .addCase(removeFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.mode = action.payload.mode;
        if (action.payload.mode === "guest") {
          state.items = action.payload.items;
          return;
        }
        const pid = action.payload.product_id;
        state.items = state.items.filter((x) => x.product_id !== pid);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload || action.error;
      });

    // syncGuestFavorites
    builder
      .addCase(syncGuestFavorites.pending, (state) => {
        state.error = null;
      })
      .addCase(syncGuestFavorites.fulfilled, (state) => {
        // no-op, fetchFavorites zaten çağrılıyor
      })
      .addCase(syncGuestFavorites.rejected, (state, action) => {
        state.error = action.payload || action.error;
      });
  },
});

export const { resetFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;

/***** Selectors *****/
export const selectFavorites = (state) => state.favorites.items;
export const selectFavoritesMode = (state) => state.favorites.mode;
export const selectFavoriteIds = (state) =>
  state.favorites.items.map((it) => it.product_id);
 
export const selectIsFavorited = (state, productId) => {
  const target = String(productId);
  return state.favorites.items?.some((it) => {
    const pid = String(it.product_id ?? it.product?.id);
    return pid === target && it.favorited === true;
  });
};
