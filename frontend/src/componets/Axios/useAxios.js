// src/Axios/useAxios.js
import axios from "axios";
import { getRefreshedToken, setAuthUser, logout } from "../Auth/auth";

const API_BASE_URL = "http://localhost:8000/api";
let hasIntervalRun = false;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "last_user_activity";

// (Opsiyonel) Public uçlar — burada token şartı yok
const PUBLIC_PATHS = [
  /^\/products\/?$/,
  /^\/products\/\d+\/?$/,
  /^\/categories\/?$/,
  /^\/brands\/?$/,
];

const isPublicPath = (p) => PUBLIC_PATHS.some((re) => re.test(p));
const stripBearer = (v) => (typeof v === "string" ? v.replace(/^Bearer\s+/i, "") : v || null);

const readTokens = () => {
  let access =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("jwt_access") ||
    localStorage.getItem("Authorization");
  let refresh =
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("refresh") ||
    localStorage.getItem("jwt_refresh");

  // "auth" objesinden de dene
  if (!access || !refresh) {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      access = access || auth.access;
      refresh = refresh || auth.refresh;
    } catch {}
  }

  return { access: stripBearer(access), refresh: stripBearer(refresh) };
};

const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = Number(payload?.exp);
    const now = Math.floor(Date.now() / 1000);
    return !exp || exp <= now;
  } catch {
    return true;
  }
};

const isSessionExpired = () => {
  const last = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!last) return false;
  return Date.now() - parseInt(last, 10) > SESSION_TIMEOUT_MS;
};

const bumpActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") window.location.href = "/login";
};

const useAxios = () => {
  const api = axios.create({ baseURL: API_BASE_URL });

  // Oturum timeout kontrolü (1 dk)
  if (!hasIntervalRun) {
    hasIntervalRun = true;
    setInterval(() => {
      if (isSessionExpired()) {
        console.warn("Oturum zaman aşımı - çıkış");
        logout();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        redirectToLogin();
      }
    }, 60 * 1000);
  }

  api.interceptors.request.use(
  async (req) => {
    const path = req.url?.startsWith("http")
      ? new URL(req.url).pathname
      : req.url || "/";

    // --- PUBLIC ENDPOINTS ---
    if (isPublicPath(path)) {
      // oturum zaman aşımı sayacını diri tut
      bumpActivity();

      // token varsa eklemek zararsız; yoksa da public istek çalışır
      const { access } = readTokens();
      if (access && !isJwtExpired(access)) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${access}`;
      }
      return req;
    }

    // --- PRIVATE ENDPOINTS ---
    const { access, refresh } = readTokens();

    // access yok → çıkış
    if (!access) {
      console.warn("Access token yok. Oturum kapatılıyor.");
      logout();
      redirectToLogin();
      return req;
    }

    // oturum (aktivite) zaman aşımı
    if (isSessionExpired()) {
      console.warn("Oturum zaman aşımı. Çıkış.");
      logout();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      redirectToLogin();
      return req;
    }

    // aktiviteyi güncelle
    bumpActivity();

    // access geçerli → direkt kullan
    if (!isJwtExpired(access)) {
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${access}`;
      return req;
    }

    // access süresi dolmuş, refresh yok → çıkış
    if (!refresh) {
      console.warn("Access süresi doldu ve refresh yok. Çıkış.");
      logout();
      redirectToLogin();
      return req;
    }

    // refresh ile yenile
    try {
      const { access: newAccess, refresh: newRefresh } = await getRefreshedToken(refresh);
      setAuthUser(newAccess, newRefresh); // localStorage/compat anahtarları güncellesin
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${newAccess}`;
      return req;
    } catch (e) {
      console.error("Refresh başarısız:", e);
      logout();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      redirectToLogin();
      return req;
    }
  },
  (err) => Promise.reject(err)
);


  return api;
};

export default useAxios;
