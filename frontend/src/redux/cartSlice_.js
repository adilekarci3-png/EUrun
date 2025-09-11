
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {api} from '../redux/authSlice';

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/cart/");
      return data; // [{id, product, quantity, ...}]
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Sepet alınamadı" });
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ product_id, quantity }, { rejectWithValue }) => {
    try {
      // Tercihen backend yeni/updated item’ı dönsün:
      const { data } = await api.post("/cart/", { product_id, quantity });
      return data; // örn: { id, product, quantity, ... }
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Sepete eklenemedi" });
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (cart_item_id, { rejectWithValue }) => {
    try {
      await api.delete("/cart/", { data: { cart_item_id } });
      return cart_item_id;
    } catch (e) {
      return rejectWithValue(e?.response?.data || { detail: "Silinemedi" });
    }
  }
);

/* Slice */
const initialState = {
  items: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // istersen burada clearCart vs. ekleyebilirsin
  },
  extraReducers: (builder) => {
    builder
      /* fetchCart */
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* addToCart */
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const added = action.payload;
        // Backend yeni öğeyi döndürdüyse state’e yansıt:
        if (added && added.id != null) {
          const idx = state.items.findIndex((x) => x.id === added.id);
          if (idx >= 0) state.items[idx] = added;
          else state.items.push(added);
        }
        // Eğer backend bir şey döndürmüyorsa, sonrası için fetchCart dispatch edebilirsin:
        // (Component'ta .unwrap().then(() => dispatch(fetchCart())))
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* removeFromCart */
      .addCase(removeFromCart.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((item) => item.id !== id);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default cartSlice.reducer;
