import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

function PasswordResetConfirm() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const initialValues = {
    password: "",
    password2: "",
  };

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Parola en az 6 karakter olmalı")
      .required("Parola zorunludur"),
    password2: Yup.string()
      .oneOf([Yup.ref("password")], "Parolalar eşleşmiyor")
      .required("Parola tekrar zorunludur"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await axios.post(`http://localhost:8000/api/password-reset-confirm/${uidb64}/${token}/`, {
        password: values.password,
      });
      Swal.fire("Başarılı", "Parolanız güncellendi.", "success").then(() => {
        navigate("/giris");
      });
      resetForm();
    } catch (err) {
      Swal.fire("Hata", err.response?.data?.error || "Bir hata oluştu.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4">
        <h2 className="text-center mb-4">Yeni Parola</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-3">
                <label htmlFor="password">Yeni Parola</label>
                <Field
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Yeni parolanızı girin"
                />
                <ErrorMessage name="password" component="div" className="text-danger" />
              </div>
              <div className="mb-3">
                <label htmlFor="password2">Yeni Parola (Tekrar)</label>
                <Field
                  type="password"
                  name="password2"
                  className="form-control"
                  placeholder="Parolanızı tekrar girin"
                />
                <ErrorMessage name="password2" component="div" className="text-danger" />
              </div>
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={isSubmitting}
              >
                Kaydet
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default PasswordResetConfirm;


