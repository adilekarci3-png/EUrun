import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Swal from "sweetalert2";
import "../css/SMSGiris.css";

function SMSGiris() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    if (!phone) {
      setMessage("❌ Telefon numarası gerekli.");
      return;
    }

    // Telefon numarası formatını kontrol et
    const phoneRegex = /^(05|5)\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      setMessage("❌ Geçerli bir telefon numarası girin (05XXXXXXXXX).");
      return;
    }

    setLoading(true);
    try {
      // API endpoint güncellendi
      const response = await axios.post("http://127.0.0.1:8000/api/auth/send-sms/", { 
        phone: phone.replace(/\s/g, "") // Boşlukları temizle
      });
      
      setStep(2);
      setMessage("📨 Doğrulama kodu gönderildi.");
      
      Swal.fire({
        title: "Kod Gönderildi!",
        text: "Telefon numaranıza gelen doğrulama kodunu girin.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (err) {
      console.error("SMS send error:", err);
      
      let errorMessage = "❌ Kod gönderilemedi.";
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          errorMessage = `❌ ${errorData.error}`;
        } else if (errorData.detail) {
          errorMessage = `❌ ${errorData.detail}`;
        } else if (errorData.phone) {
          errorMessage = `❌ Telefon: ${Array.isArray(errorData.phone) ? errorData.phone.join(" ") : errorData.phone}`;
        }
      }
      
      setMessage(errorMessage);
      Swal.fire("Hata", errorMessage.replace("❌ ", ""), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setMessage("❌ Doğrulama kodu gerekli.");
      return;
    }

    if (code.length !== 4) {
      setMessage("❌ Doğrulama kodu 4 haneli olmalı.");
      return;
    }

    setLoading(true);
    try {
      // API endpoint güncellendi
      const response = await axios.post("http://127.0.0.1:8000/api/auth/verify-code/", { 
        phone: phone.replace(/\s/g, ""), 
        code 
      });
      
      const tokens = {
        access: response.data.access,
        refresh: response.data.refresh
      };
      
      // Token'ları localStorage'a kaydet
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      
      // JWT'den user bilgisini çıkar
      const user = jwtDecode(tokens.access);
      
      // Redux store'u güncelle
      dispatch(loginSuccess({
        ...tokens,
        user
      }));
      
      setMessage("✅ Giriş başarılı.");
      
      Swal.fire({
        title: "Başarılı!",
        text: "SMS ile giriş yaptınız.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate("/products");
      });
      
    } catch (err) {
      console.error("SMS verify error:", err);
      
      let errorMessage = "❌ Kod hatalı veya süresi dolmuş.";
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error) {
          errorMessage = `❌ ${errorData.error}`;
        } else if (errorData.detail) {
          errorMessage = `❌ ${errorData.detail}`;
        } else if (errorData.code) {
          errorMessage = `❌ Kod: ${Array.isArray(errorData.code) ? errorData.code.join(" ") : errorData.code}`;
        }
      }
      
      setMessage(errorMessage);
      Swal.fire("Hata", errorMessage.replace("❌ ", ""), "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Sadece rakamlar
    
    // 05 ile başlamıyorsa otomatik ekle
    if (value.length > 0 && !value.startsWith("05")) {
      if (value.startsWith("5")) {
        value = "0" + value;
      }
    }
    
    // Maksimum 11 karakter
    if (value.length <= 11) {
      setPhone(value);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Sadece rakamlar
    if (value.length <= 4) {
      setCode(value);
    }
  };

  const handleBackToPhone = () => {
    setStep(1);
    setCode("");
    setMessage("");
  };

  return (
    <div className="sms-login-container">
      <div className="sms-login-card">
        <h2>📱 SMS ile Giriş</h2>

        {message && (
          <div className={`sms-message ${message.includes("✅") ? "success" : message.includes("📨") ? "info" : "error"}`}>
            {message}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="sms-form-group">
              <label htmlFor="phone">Telefon Numaranız *</label>
              <input
                id="phone"
                type="text"
                placeholder="05XXXXXXXXX"
                value={phone}
                onChange={handlePhoneChange}
                className="sms-input"
                maxLength="11"
              />
              <small className="text-muted">
                Telefon numaranızı 05 ile başlayacak şekilde girin
              </small>
            </div>
            
            <button 
              onClick={handleSendSMS} 
              className="sms-button"
              disabled={loading || !phone}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Gönderiliyor...
                </>
              ) : (
                "Kodu Gönder"
              )}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="sms-form-group">
              <label htmlFor="code">
                Gelen Kodu Girin *
                <small className="text-muted d-block">
                  {phone} numarasına gönderilen 4 haneli kodu girin
                </small>
              </label>
              <input
                id="code"
                type="text"
                placeholder="1234"
                value={code}
                onChange={handleCodeChange}
                className="sms-input text-center"
                maxLength="4"
                autoFocus
              />
            </div>
            
            <button 
              onClick={handleVerifyCode} 
              className="sms-button"
              disabled={loading || !code}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Doğrulanıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
            
            <button 
              onClick={handleBackToPhone} 
              className="sms-button-secondary mt-2"
              disabled={loading}
            >
              ← Telefon Numarasını Değiştir
            </button>
          </>
        )}

        <div className="sms-footer">
          <p>
            <Link to="/login" className="text-primary">
              ← Normal giriş yap
            </Link>
          </p>
          <p>
            Hesabın yok mu?{" "}
            <Link to="/register" className="text-primary">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SMSGiris;