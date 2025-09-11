import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
// import axios from "axios";
import api from "../redux/authSlice";
import Swal from "sweetalert2";
import KategoriListe from "./KategoriListe";
import MarkaListe from "./MarkaListe";

function KategoriMarkaEkle() {
  const [kategoriler, setKategoriler] = useState([]);
  const [markalar, setMarkalar] = useState([]);
  
  // Verileri çek
  const fetchData = async () => {
    try {
      const [kategoriRes, markaRes] = await Promise.all([
        api.get(`/categories/`),
        api.get(`/brands/`)
      ]);
      setKategoriler(kategoriRes.data);
      setMarkalar(markaRes.data);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    }
  };

  // Sayfa ilk yüklendiğinde verileri al
  useEffect(() => {
    fetchData();
  }, []);

  const validationSchemaKategori = Yup.object({
    name: Yup.string()
      .min(3, "Kategori en az 3 karakter olmalıdır")
      .required("Kategori zorunludur"),
  });

  const validationSchemaMarka = Yup.object({
    name: Yup.string()
      .min(3, "Marka en az 3 karakter olmalıdır")
      .required("Marka zorunludur"),
  });

  const handleSubmitKategori = async (values, { setSubmitting, resetForm }) => {
    try {
      await api.post(`/categories/create/`, {
        name: values.name,
      });
      Swal.fire("Başarılı", "Kategori Eklendi", "success");
      // Veriyi tekrar çek
      await fetchData();
      resetForm();
    } catch (err) {
      Swal.fire(
        "Hata",
        err.response?.data?.error || "Bir hata oluştu.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMarka = async (values, { setSubmitting, resetForm }) => {
    try {
      await api.post(`/brands/create/`, {
        name: values.name,
      });
      Swal.fire("Başarılı", "Marka Eklendi", "success");
      // Veriyi tekrar çek
      await fetchData();
      resetForm();
    } catch (err) {
      Swal.fire(
        "Hata",
        err.response?.data?.error || "Bir hata oluştu.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col xs={12} md={6}>
          <Formik
            initialValues={{ name: "" }}
            validationSchema={validationSchemaKategori}
            onSubmit={handleSubmitKategori}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="mb-3">
                  <label>Kategori Adı</label>
                  <Field name="name" className="form-control" />
                  <ErrorMessage
                    name="name"
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
        </Col>
        <Col xs={12} md={6}>
          <Formik
            initialValues={{ name: "" }}
            validationSchema={validationSchemaMarka}
            onSubmit={handleSubmitMarka}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="mb-3">
                  <label>Marka Adı</label>
                  <Field name="name" className="form-control" />
                  <ErrorMessage
                    name="name"
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
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <KategoriListe kategoriler={kategoriler} />
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <MarkaListe markalar={markalar} />
        </Col>
      </Row>
    </Container>
  );
}

export default KategoriMarkaEkle;
