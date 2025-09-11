import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../redux/authSlice";

const LS_KEY = "guest_cart_v1";

const readGuest = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
};
const writeGuest = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

const upsertGuestItem = ({ product_id, quantity, product }) => {
  const items = readGuest();
  const idx = items.findIndex((x) => x.product_id === product_id);
  if (idx >= 0) {
    items[idx].quantity = (items[idx].quantity || 0) + quantity;
  } else {
    items.push({ product_id, quantity, ...(product ? { product } : {}) });
  }
  writeGuest(items);
  return items;
};

const removeGuestItem = (product_id) => {
  const items = readGuest().filter((x) => x.product_id !== product_id);
  writeGuest(items);
  return items;
};

const clearGuest = () => writeGuest([]);

/** === Thunks === **/

// Not: fetchCart hem guest hem server için çalışır
export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      return { mode: "guest", items: readGuest() };
    }
    try {
      const { data } = await api.get("/cart/");
      // Beklenen: [{id: cart_item_id, product: {...}, quantity, ...}]
      return { mode: "server", items: Array.isArray(data) ? data : [] };
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Sepet alınamadı" });
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ product_id, quantity, product }, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      const items = upsertGuestItem({ product_id, quantity, product });
      return { mode: "guest", items };
    }
    try {
      const { data } = await api.post("/cart/", { product_id, quantity });
      return { mode: "server", item: data }; // örn {id, product, quantity,...}
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Sepete eklenemedi" });
    }
  }
);


export const removeFromCart = createAsyncThunk(
  "cart/remove", 
  async (payload, { getState, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) {
      const items = removeGuestItem(payload.product_id);
      return { mode: "guest", items };
    }
    try {
      debugger;
      // console.log(payload.cart_item_id);
      await api.delete("/cart/", { data: { cart_item_id: payload} });
      return { mode: "server", cart_item_id: payload};
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Silinemedi" });
    }
  }
);

// Login sonrası misafir sepetini backend’e merge et
export const syncGuestCart = createAsyncThunk(
  "cart/syncGuest",
  /**
   * Opsiyonel olarak bulk endpoint’in varsa kullan:
   *  await api.post("/cart/bulk/", { items: guestItems })
   */
  async (_, { getState, dispatch, rejectWithValue }) => {
    const isLoggedIn = !!getState()?.auth?.access;
    if (!isLoggedIn) return { done: false };

    const guestItems = readGuest();
    if (!guestItems.length) return { done: true };

    try {
      // Basit sıra ile ekleme (güvenli yol). Backend’inde bulk varsa orayı tercih et.
      for (const gi of guestItems) {
        await api.post("/cart/", {
          product_id: gi.product_id,
          quantity: gi.quantity,
        });
      }
      clearGuest();
      // Sunucu sepetini tazele
      await dispatch(fetchCart());
      return { done: true };
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Guest sepet merge edilemedi" });
    }
  }
);

/** === Slice === **/
const initialState = {
  items: [],      // Tek liste: guest’te [{product_id, quantity, product?}], server’da [{id, product, quantity}]
  mode: "guest",  // "guest" | "server"  (ekranda işleyişi kolaylaştırır)
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearLocalCart(state) {
      clearGuest();
      if (state.mode === "guest") state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchCart */
      .addCase(fetchCart.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCart.fulfilled, (s, a) => {
        s.loading = false;
        s.mode = a.payload.mode;
        s.items = a.payload.items;
      })
      .addCase(fetchCart.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      /* addToCart */
      .addCase(addToCart.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(addToCart.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload.mode === "guest") {
          s.mode = "guest";
          s.items = a.payload.items; // localStorage’daki güncel liste
        } else {
          s.mode = "server";
          const added = a.payload.item;
          if (added && added.id != null) {
            const idx = s.items.findIndex((x) => x.id === added.id);
            if (idx >= 0) s.items[idx] = added;
            else s.items.push(added);
          }
        }
      })
      .addCase(addToCart.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      /* removeFromCart */
      .addCase(removeFromCart.fulfilled, (s, a) => {
        if (a.payload.mode === "guest") {
          s.mode = "guest";
          s.items = a.payload.items;
        } else {
          s.mode = "server";
          const id = a.payload.cart_item_id;
          s.items = s.items.filter((it) => it.id !== id);
        }
      })
      .addCase(removeFromCart.rejected, (s, a) => { s.error = a.payload; })

      /* syncGuestCart */
      .addCase(syncGuestCart.rejected, (s, a) => { s.error = a.payload; });
  },
});

export const { clearLocalCart } = cartSlice.actions;
export default cartSlice.reducer;
