import React from "react";
import { ListGroup, Button, Form, Badge } from "react-bootstrap";
import { Formik, Field, Form as FormikForm, ErrorMessage } from "formik";
import * as Yup from "yup";
import { renderStars } from "../utils/renderStars";
// import { format } from "date-fns";
// import { tr } from "date-fns/locale"; // Türkçe için

const ProductReviewsTab = ({
  reviews = [],
  userRating,
  onRatingChange,
  onSubmitReview,
}) => {
  const initialValues = {
    comment: "",
  };

  const validationSchema = Yup.object({
    comment: Yup.string()
      .min(5, "Yorum en az 5 karakter olmalı")
      .required("Yorum alanı boş bırakılamaz"),
  });

  const handleSubmit = (values, { resetForm }) => {
    onSubmitReview(values.comment);
    resetForm();
  };

  return (
    <>
      <div className="mb-4">
        <strong className="me-2">Sizin Puanınız:</strong>
        {renderStars(userRating, true, onRatingChange)}
      </div>

      <ListGroup variant="flush" className="mb-4">
        {reviews.length === 0 ? (
          <ListGroup.Item>Henüz Yorum Yok</ListGroup.Item>
        ) : (
          reviews.map((rev, idx) => (
            <ListGroup.Item key={idx}>
              <div className="d-flex justify-content-between">
                <div>
                  <strong>{rev.user}</strong> {" "}
                  <Badge bg="secondary">
                    {rev.rating} ⭐
                  </Badge>
                </div>
                <small className="text-muted">
                  {rev.created_at}
                  {/* {rev.created_at
                    ? format(new Date(rev.created_at), "d MMMM yyyy HH:mm", {
                        locale: tr,
                      })
                    : ""} */}
                </small>
              </div>
              <div className="mt-2">{rev.comment}</div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <FormikForm>
            <h5 className="mb-3">Yorum Ekle</h5>
            <Form.Group className="mb-2" controlId="comment">
              <Field
                as="textarea"
                name="comment"
                rows={3}
                placeholder="Yorumunuzu yazın..."
                className="form-control"
              />
              <div className="text-danger mt-1">
                <ErrorMessage name="comment" />
              </div>
            </Form.Group>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Gönder
            </Button>
          </FormikForm>
        )}
      </Formik>
    </>
  );
};

export default ProductReviewsTab;
