import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";

function PasswordResetRequest() {
  const initialValues = {
    email: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Geçerli bir e-posta adresi giriniz")
      .required("E-posta zorunludur"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await axios.post("http://localhost:8000/api/password-reset/", {
        email: values.email,
      });
      Swal.fire("Başarılı", "Sıfırlama bağlantısı e-posta adresinize gönderildi.", "success");
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
        <h2 className="text-center mb-4">Şifre Sıfırlama</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-3">
                <label htmlFor="email">E-posta</label>
                <Field
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="E-posta adresinizi girin"
                />
                <ErrorMessage name="email" component="div" className="text-danger" />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isSubmitting}
              >
                Gönder
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default PasswordResetRequest;





