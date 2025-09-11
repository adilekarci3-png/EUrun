// src/pages/SMSGiris.jsx
import React, { useEffect, useState } from "react";
import "../css/SMSGiris.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Auth
import {
  sendSmsCode,
  verifySmsCode,
  selectSms,
  fetchMe, // ← eklendi
} from "../../redux/authSlice"; // <-- yolu projene göre düzenleyebilirsin

// Cart
import { addToCart, fetchCart } from "../../redux/cartSlice";

// Favorites
import { addFavorite, fetchFavorites } from "../../redux/favoritesSlice";

const SMSGiris = () => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status: smsStatus, error: smsError } = useSelector(selectSms);

  // STATE'TEN SEPET & FAVORİLER
  const cartItems = useSelector((s) => s.cart.items); // [{ product_id, qty, ... }]
  const favoriteItems = useSelector((s) => s.favorites.items); // [{ product_id, product, favorited: true }, ...]

  // SMS gönderildiğinde 2. adıma geç
  useEffect(() => {
    if (smsStatus === "sent") {
      setStep(2);
      setMessage("📨 Doğrulama kodu gönderildi.");
    } else if (smsStatus === "failed" && smsError) {
      setMessage(`❌ ${smsError.detail || "Kod gönderilemedi."}`);
    }
  }, [smsStatus, smsError]);

  // NOT: Artık "verified" durumunda otomatik navigate etmiyoruz;
  // senkron işlemleri handleVerifyCode içinde bitirip yönlendiriyoruz.

  const handleSendSMS = () => {
    const trimmed = phone.replace(/\s+/g, "");
    if (!trimmed) {
      setMessage("❌ Telefon numarası gerekli.");
      return;
    }
    setMessage("");
    dispatch(sendSmsCode({ phone: trimmed }));
  };

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
                quantity: it.qty ?? 1, // thunk param adların farklıysa düzenle
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
      // Sunucu durumunu tazele
      await Promise.all([dispatch(fetchCart()), dispatch(fetchFavorites())]);
    }
  };

  const handleVerifyCode = () => {
    const p = phone.replace(/\s+/g, "");
    const c = code.trim();
    if (!p || !c) {
      setMessage("❌ Telefon ve kod gerekli.");
      return;
    }
    setMessage("");

    dispatch(verifySmsCode({ phone: p, code: c }))
      .unwrap()
      .then(async () => {
        // Kullanıcı bilgisini kesinleştir
        await dispatch(fetchMe());

        // Sepet & Favori senkronu
        await syncAfterAuth();

        setMessage("✅ Giriş başarılı.");
        navigate("/products", { replace: true }); // giriş sonrası
      })
      .catch((err) => {
        setMessage(`❌ ${err?.detail || "Kod hatalı veya süresi dolmuş."}`);
      });
  };

  const loading = smsStatus === "loading" || smsStatus === "verifying";

  return (
    <div className="sms-login-container">
      <div className="sms-login-card">
        <h2>📱 SMS ile Giriş</h2>

        {message && <div className="sms-message">{message}</div>}

        {step === 1 && (
          <>
            <label htmlFor="phone">Telefon Numaranız:</label>
            <input
              id="phone"
              type="text"
              placeholder="05XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="sms-input"
              disabled={loading}
            />
            <button
              onClick={handleSendSMS}
              className="sms-button"
              disabled={loading}
            >
              {loading ? "Gönderiliyor..." : "Kodu Gönder"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="code">Gelen Kodu Girin:</label>
            <input
              id="code"
              type="text"
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="sms-input"
              disabled={loading}
            />
            <button
              onClick={handleVerifyCode}
              className="sms-button"
              disabled={loading}
            >
              {loading ? "Doğrulanıyor..." : "Giriş Yap"}
            </button>

            <div className="sms-footer mt-2">
              <button
                type="button"
                className="link-like"
                onClick={() => {
                  setStep(1);
                  setMessage("");
                }}
                disabled={loading}
              >
                Başka numara gir
              </button>
            </div>
          </>
        )}

        <div className="sms-footer">
          <a href="/register">Hesabın yok mu? Kayıt Ol</a>
        </div>
      </div>
    </div>
  );
};

export default SMSGiris;
