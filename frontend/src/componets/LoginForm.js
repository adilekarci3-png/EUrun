import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, login } from "../redux/authSlice";
import "../css/Login.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error } = useSelector(selectAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(login(form));

    if (login.fulfilled.match(resultAction)) {
      Swal.fire("Başarılı", "Giriş Yaptınız", "success").then(() =>
        navigate("/products")
      );
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

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="email"
            className="fadeIn second"
            placeholder="Kullanıcı Adı"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="fadeIn third"
              placeholder="Parola"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              👁
            </button>
          </div>

          {error && (
            <div className="text-danger small mt-2 text-center">
              {error.detail || "Kullanıcı adı veya parola hatalı!"}
            </div>
          )}

          <input
            type="submit"
            className="fadeIn fourth mt-3"
            value={status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
            disabled={status === "loading"}
          />
        </form>

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
        >
          <FaGoogle size={28} color="#DB4437" />
        </div>
      </div>
    </div>
  );
}

export default Login;
