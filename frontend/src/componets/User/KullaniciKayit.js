import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import Footer from "../Footer";
import Header from "../Header";

function KullaniciKayit() {
  return (
    <>
      <Header />

      <section
        className="container d-flex flex-column vh-100"
        style={{ marginTop: "25px" }}
      >
        <div className="row align-items-center justify-content-center g-0 h-lg-100 py-4">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow">
              <div className="card-body p-5">
                <h2 className="mb-4 fw-bold text-center">Kullanıcı Kaydı</h2>

                <Formik
                  initialValues={{
                    email: "",
                    email: "",
                    password: "",
                    password2: "",
                    first_name: "",
                    last_name: "",
                  }}
                  validate={(values) => {
                    const errors = {};
                    if (!values.email)
                      errors.email = "Kullanıcı adı gerekli";
                    if (!values.email) errors.email = "Email gerekli";
                    if (values.password !== values.password2)
                      errors.password2 = "Parolalar eşleşmiyor";
                    return errors;
                  }}
                  onSubmit={async (values, { setSubmitting, resetForm }) => {
                    
                    try {
                      await axios.post(
                        "http://localhost:8000/api/register/",
                        values
                      );
                      Swal.fire("Başarılı", "Kayıt Oldunuz", "success");
                      resetForm();
                    } catch (error) {
                      
                      //Swal.fire("Hata", JSON.stringify(error.response?.data), "error");
                      const errors = error.response?.data;
                      let errorMessage = "Bir hata oluştu.";

                      if (errors && typeof errors === "object") {
                        errorMessage = Object.entries(errors)
                          .map(
                            ([field, messages]) =>
                              `${field}: ${messages.join(" ")}`
                          )
                          .join("\n");
                      }

                      Swal.fire("Hata", errorMessage, "error");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="mb-3">
                        <label>Kullanıcı Adı</label>
                        <Field name="email" className="form-control" />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <div className="mb-3">
                        <label>Email</label>
                        <Field
                          name="email"
                          type="email"
                          className="form-control"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <div className="mb-3">
                        <label>Ad</label>
                        <Field name="first_name" className="form-control" />
                      </div>

                      <div className="mb-3">
                        <label>Soyad</label>
                        <Field name="last_name" className="form-control" />
                      </div>

                      <div className="mb-3">
                        <label>Parola</label>
                        <Field
                          name="password"
                          type="password"
                          className="form-control"
                        />
                      </div>

                      <div className="mb-3">
                        <label>Parola Tekrar</label>
                        <Field
                          name="password2"
                          type="password"
                          className="form-control"
                        />
                        <ErrorMessage
                          name="password2"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Kaydediliyor..." : "Kaydol"}
                      </button>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default KullaniciKayit;
