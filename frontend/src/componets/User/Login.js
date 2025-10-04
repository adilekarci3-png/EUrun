// src/components/auth/Login.jsx
import React, { useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "../css/Login.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { login, fetchMe } from "../../redux/authSlice";
import { readGuestCart, clearGuestCart } from "../../utils/guestCart";
import { addToCart, fetchCart } from "../../redux/cartSlice"
import { syncGuestFavorites } from "../../redux/favoritesSlice";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Primitive selector'lar: gereksiz rerender uyarısı olmaz
  const status = useSelector((s) => s.auth.status);
  const authError = useSelector((s) => s.auth.error);

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  // Basit email kontrolü (Formik validate içinde kullanacağız)
  const emailRe = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    setLocalError("");
    try {
      const email = values.email.trim();
      const pwd = values.password;
      const action = await dispatch(login({ email, password: pwd }));

      if (login.fulfilled.match(action)) {
        await dispatch(fetchMe());
        await dispatch(syncGuestFavorites()).unwrap().catch(() => {});
        const guestItems = readGuestCart();
        // 1) guest cart'ı oku

        if (guestItems.length) {
          // 2) her bir ürünü server sepetine ekle
          await Promise.all(
            guestItems.map(
              (gi) =>
                dispatch(
                  addToCart({
                    product_id: gi.product_id,
                    quantity: gi.quantity,
                    product: gi.product, // thunk'ta opsiyonel; gönderebilirsin
                  })
                )
                  .unwrap()
                  .catch(() => {}) // bir tanesi patlarsa diğerleri devam etsin
            )
          );
          // 3) guest sepetini temizle ve sunucu sepetini yeniden çek
          clearGuestCart();
          await dispatch(fetchCart());
        }

        await Swal.fire("Başarılı", "Giriş yaptınız", "success");
        navigate("/products", { replace: true });
      } else {
        const msg =
          action.payload?.detail ||
          action.payload?.error ||
          "Kullanıcı adı veya parola hatalı!";
        setLocalError(msg);
        await Swal.fire("Hata", msg, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper fadeInDown">
      <div id="formContent">
        <div className="fadeIn first">
          <img
            src="/resources/images/enter.png"
            style={{ width: "55px", height: "55px", objectFit: "contain" }}
            alt="User Icon"
          />
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validate={(values) => {
            const errors = {};
            if (!values.email) errors.email = "Kullanıcı adı gerekli";
            else if (!emailRe.test(values.email.trim()))
              errors.email = "Geçerli bir e-posta girin";
            if (!values.password) errors.password = "Parola gerekli";
            return errors;
          }}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field
                type="text"
                name="email"
                className="fadeIn second"
                placeholder="Kullanıcı Adı"
                autoComplete="username"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-danger small"
              />

              <div style={{ position: "relative" }}>
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="fadeIn third"
                  placeholder="Parola"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label={
                    showPassword ? "Parolayı gizle" : "Parolayı göster"
                  }
                >
                  👁
                </button>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="text-danger small"
              />

              {(localError || authError?.detail) && (
                <div className="text-danger small mt-2 text-center">
                  {localError || authError.detail}
                </div>
              )}

              <input
                type="submit"
                className="fadeIn fourth mt-3"
                value={
                  isSubmitting || status === "loading"
                    ? "Giriş yapılıyor..."
                    : "Giriş Yap"
                }
                disabled={isSubmitting || status === "loading"}
              />
            </Form>
          )}
        </Formik>

        <div id="formFooter">
          <a className="underlineHover" href="/password-reset">
            Şifremi unuttum?
          </a>
        </div>
        <div id="formFooter">
          <a className="underlineHover" href="/register">
            Kayıt Ol?
          </a>
        </div>
        <div id="formFooter">
          <a className="underlineHover" href="/sms-giris">
            SMS Giriş
          </a>
        </div>
        <div
          onClick={() => navigate("/googleLogin")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            marginTop: "1rem",
          }}
          title="Google ile giriş yap"
          className="fadeIn fourth"
        >
          <FaGoogle size={28} color="#DB4437" />
        </div>
      </div>
    </div>
  );
}

export default Login;
