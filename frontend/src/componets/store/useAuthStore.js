import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";

const useAuthStore = create((set, get) => ({
  allUserData: null,
  loading: false,

  user: () => ({
    user_id: get().allUserData?.user_id || null,
    email: get().allUserData?.email || null,
  }),

  setUser: (user) =>
    set({
      allUserData: user,
    }),

  setLoading: (loading) => set({ loading }),

  isLoggedIn: () => get().allUserData !== null,

  // ✅ Yeni: roleData yönetimi
  roleData: null,
  setRoleData: (role) => set({ roleData: role }),
}));

if (process.env.NODE_ENV === "development") {  
  mountStoreDevtool("Store", useAuthStore);
}

export { useAuthStore };
