// src/components/auth/GoogleLoginButton.jsx
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Auth
import { googleLogin, fetchMe } from "../../redux/authSlice";

// Cart
import { addToCart, fetchCart } from "../../redux/cartSlice";

// Favorites
import { addFavorite, fetchFavorites } from "../../redux/favoritesSlice";

const clientId =
  "961268135642-hqrp3a2c7jiapao7ilo43je3fg47muja.apps.googleusercontent.com";

export default function GoogleLoginButton_() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Primitive selector'lar (daha stabil render için)
  const status = useSelector((s) => s.auth.socialStatus);
  const error = useSelector((s) => s.auth.socialError);

  // STATE'TEN SEPET & FAVORİLER
  const cartItems = useSelector((s) => s.cart.items); // [{ product_id, qty, ... }]
  const favoriteItems = useSelector((s) => s.favorites.items); // [{ product_id, product, favorited: true }, ...]

  // Giriş sonrası guest -> server senkronu
  const syncAfterAuth = async () => {
    try {
      // Sepet senkronu
      if (Array.isArray(cartItems) && cartItems.length) {
        await Promise.all(
          cartItems.map((it) =>
            dispatch(
              addToCart({
                product_id: Number(it.product_id ?? it?.product?.id),
                quantity: it.qty ?? 1, // kendi thunk param adın farklıysa düzenle
              })
            )
          )
        );
      }
      // Favori senkronu
      if (Array.isArray(favoriteItems) && favoriteItems.length) {
        await Promise.all(
          favoriteItems.map((it) =>
            dispatch(
              addFavorite({
                product_id: Number(it.product_id ?? it?.product?.id),
              })
            )
          )
        );
      }
    } finally {
      // Sunucu durumunu güncelle
      await Promise.all([dispatch(fetchCart()), dispatch(fetchFavorites())]);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      await Swal.fire("Hata", "Google token alınamadı", "error");
      return;
    }

    try {
      const action = await dispatch(googleLogin({ credential }));

      if (googleLogin.fulfilled.match(action)) {
        // Kullanıcı bilgisini kesinleştir
        await dispatch(fetchMe());

        // Sepet & Favori senkronu
        await syncAfterAuth();

        const userEmail = action.payload?.user?.email || "";
        await Swal.fire("Başarılı", `Hoş geldiniz ${userEmail}`, "success");
        navigate("/products", { replace: true });
      } else {
        const msg =
          action.payload?.detail ||
          action.payload?.error ||
          action.error?.message ||
          "Google ile giriş başarısız oldu";
        await Swal.fire("Hata", msg, "error");
      }
    } catch (e) {
      await Swal.fire("Hata", "Beklenmeyen bir hata oluştu.", "error");
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem" }}>Google ile Giriş</h2>

          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => Swal.fire("Hata", "Google login başarısız", "error")}
            useOneTap={false}
            ux_mode="popup"
          />

          {status === "loading" && (
            <div style={{ marginTop: "0.75rem" }}>Google ile giriş yapılıyor...</div>
          )}
          {error?.detail && (
            <div style={{ marginTop: "0.75rem", color: "red" }}>{error.detail}</div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
