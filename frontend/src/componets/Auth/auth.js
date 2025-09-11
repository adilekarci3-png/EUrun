// src/Auth/auth.js
import { useAuthStore } from "../store/useAuthStore";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

const API_BASE = "http://localhost:8000/api";
const LAST_ACTIVITY_KEY = "last_user_activity";

// Çıkış
export const logout = () => {
  localStorage.removeItem("auth");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");
  localStorage.removeItem("last_user_activity");
};

export const setAuthUser = (access, refresh, user = null) => {
  debugger;
  const prev = JSON.parse(localStorage.getItem("auth") || "{}");
  const next = {
    access: access || prev.access || null,
    refresh: refresh || prev.refresh || null,
    user: user ?? prev.user ?? null,
    roles: (user?.roles) ?? prev.roles ?? [],
  };
  localStorage.setItem("auth", JSON.stringify(next));
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("last_user_activity", Date.now().toString());
};

export const getRefreshedToken = async (refresh) => {
  // DRF SimpleJWT varsayılan refresh endpoint’i:
  const res = await fetch("http://localhost:8000/api/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("refresh failed");
  const data = await res.json(); // { access: "..." }
  return { access: data.access, refresh };
};

// Access token süresi dolmuş mu?
export const isAccessTokenExpired = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = Number(payload.exp);
    const now = Math.floor(Date.now() / 1000);
    return !exp || exp < now;
  } catch {
    // Geçersiz JWT → expired say
    return true;
  }
};

// Uygulama açılışında kullanıcıyı set et
export const setUser = async () => {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  if (!access || !refresh) {
    useAuthStore.getState().setLoading?.(false);
    return;
  }

  if (isAccessTokenExpired()) {
    try {
      const { access: newAccess, refresh: newRefresh } = await getRefreshedToken(refresh);
      setAuthUser(newAccess, newRefresh);
    } catch (err) {
      console.warn("Refresh başarısız:", err);
      Swal.fire("Oturum Süresi Doldu", "Lütfen tekrar giriş yapınız", "error");
      logout();
    }
  } else {
    setAuthUser(access, refresh);
  }
};
