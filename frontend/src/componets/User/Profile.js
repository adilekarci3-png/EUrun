import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {api} from "../../redux/authSlice";
import Swal from "sweetalert2";
import "../css/Profile.css";

const Profile = () => {
  
  const [initialValues, setInitialValues] = useState({    
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    api
      .get("/profile/", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => {
        const data = res.data;
        setInitialValues({
          email: data.email,          
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.profile?.phone || "",
          address: data.profile?.address || "",
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required("Ad zorunlu"),
    last_name: Yup.string().required("Soyad zorunlu"),
    email: Yup.string().email("Geçersiz e-posta").required("E-posta zorunlu"),
    phone: Yup.string()
      .matches(/^\d{10,15}$/, "Geçerli bir telefon girin")
      .nullable(),
    address: Yup.string().required("Adres gerekli"),
  });

  const handleSubmit = (values, { setSubmitting }) => {
    const token = localStorage.getItem("access_token");
    api
      .put("/profile/", values, {
        headers: { Authorization: "Bearer " + token },
      })
      .then(() => {
        setMessage("✅ Profil başarıyla güncellendi.");
        Swal.fire("Güncellendi", "Profil bilgileri kaydedildi", "success");
      })
      .catch(() => {
        setMessage("❌ Güncelleme sırasında hata oluştu.");
        Swal.fire("Hata", "Bilgiler kaydedilemedi", "error");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">Profil Bilgileri</h2>

      {message && (
        <div
          className={`profile-message ${
            message.includes("✅") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="profile-form-grid">
            {/* Kullanıcı Adı (readonly) */}
            <div className="profile-form-group">
              <label htmlFor="email">Kullanıcı Adı</label>
              <Field
                type="text"
                name="email"
                id="email"
                className="profile-input"
                disabled
              />
            </div>

            {/* Ad */}
            <div className="profile-form-group">
              <label htmlFor="first_name">Ad</label>
              <Field
                type="text"
                name="first_name"
                id="first_name"
                className="profile-input"
                placeholder="Adınızı girin"
              />
              <ErrorMessage name="first_name" component="div" className="profile-error" />
            </div>

            {/* Soyad */}
            <div className="profile-form-group">
              <label htmlFor="last_name">Soyad</label>
              <Field
                type="text"
                name="last_name"
                id="last_name"
                className="profile-input"
                placeholder="Soyadınızı girin"
              />
              <ErrorMessage name="last_name" component="div" className="profile-error" />
            </div>

            {/* E-posta */}
            <div className="profile-form-group">
              <label htmlFor="email">E-posta</label>
              <Field
                type="email"
                name="email"
                id="email"
                className="profile-input"
                placeholder="example@mail.com"
              />
              <ErrorMessage name="email" component="div" className="profile-error" />
            </div>

            {/* Telefon */}
            <div className="profile-form-group">
              <label htmlFor="phone">Telefon</label>
              <Field
                type="text"
                name="phone"
                id="phone"
                className="profile-input"
                placeholder="5xx xxx xxxx"
              />
              <ErrorMessage name="phone" component="div" className="profile-error" />
            </div>

            {/* Adres */}
            <div className="profile-form-group profile-form-full">
              <label htmlFor="address">Adres</label>
              <Field
                as="textarea"
                name="address"
                id="address"
                rows="3"
                className="profile-input"
                placeholder="Açık adresinizi giriniz"
              />
              <ErrorMessage name="address" component="div" className="profile-error" />
            </div>

            {/* Buton */}
            <div className="profile-form-full">
              <button
                type="submit"
                disabled={isSubmitting}
                className="profile-button"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Profile;
