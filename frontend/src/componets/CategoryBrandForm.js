import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

function CategoryBrandForm() {
  // Validasyon Şemaları
  const categorySchema = Yup.object({
    name: Yup.string()
      .min(2, "En az 2 karakter olmalı")
      .required("Kategori adı gerekli"),
  });

  const brandSchema = Yup.object({
    name: Yup.string()
      .min(2, "En az 2 karakter olmalı")
      .required("Marka adı gerekli"),
  });

  // Kategori Kaydetme
  const handleCategorySubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      await axios.post("http://localhost:8000/api/categories/", values);
      Swal.fire("Başarılı!", "Kategori kaydedildi.", "success");
      resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire("Hata", "Kategori kaydedilemedi.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Marka Kaydetme
  const handleBrandSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      await axios.post("http://localhost:8000/api/brands/", values);
      Swal.fire("Başarılı!", "Marka kaydedildi.", "success");
      resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire("Hata", "Marka kaydedilemedi.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Kategori Ekle</Card.Header>
            <Card.Body>
              <Formik
                initialValues={{ name: "" }}
                validationSchema={categorySchema}
                onSubmit={handleCategorySubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label className="form-label">Kategori Adı</label>
                      <Field
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Kategori adı girin"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>Marka Ekle</Card.Header>
            <Card.Body>
              <Formik
                initialValues={{ name: "" }}
                validationSchema={brandSchema}
                onSubmit={handleBrandSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label className="form-label">Marka Adı</label>
                      <Field
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Marka adı girin"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                    <Button
                      variant="success"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CategoryBrandForm;
