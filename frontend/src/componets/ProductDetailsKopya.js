// src/components/ProductDetailsKopya.js
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Tab,
  Tabs,
  Card,
  ListGroup,
  Form,
} from "react-bootstrap";
import { api } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { addToCart, fetchCart } from "../redux/cartSlice";
import { FaShoppingCart, FaHeart, FaRegHeart } from "react-icons/fa";
import { renderStars } from "../utils/renderStars";
import ProductReviewsTab from "./ProductReviewsTab";

function ProductDetailsKopya() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [message, setMessage] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);

  // .env'den API tabanı; yoksa localhost
  const API_BASE =
    process.env.REACT_APP_API_BASE || "http://localhost:8000";

  // Mesajı 3 sn sonra temizle
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // VERİYİ ÇEK — useCallback ile stable
  const fetchData = useCallback(async (signal) => {
    const [
      productRes,
      userRatingRes,
      favoritedRes,
      reviewsRes,
      questionsRes,
    ] = await Promise.all([
      api.get(`products/${id}/`, { signal }),
      api.get(`products/${id}/user-rating/`, { signal }),
      api.get(`products/${id}/is-favorited/`, { signal }),
      api.get(`products/${id}/reviews/`, { signal }),
      api.get(`products/${id}/qa/`, { signal }),
    ]);

    setProduct(productRes.data);
    setAverageRating(productRes.data?.rating ?? 0);
    setUserRating(userRatingRes.data?.rating ?? 0);
    setFavorited(!!favoritedRes.data?.favorited);
    setReviews(reviewsRes.data ?? []);
    setQuestions(questionsRes.data ?? []);
  }, [id]);

  // İlk yükleme + id değişince tekrar
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        await fetchData(controller.signal);
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
        console.error("Veriler alınırken hata oluştu:", error);
      }
    })();
    return () => controller.abort();
  }, [fetchData]);

  const handleAddToCart = () => {
    if (!product?.id) return;
    dispatch(addToCart({ product_id: product.id, quantity: 1 }))
      .then(() => dispatch(fetchCart()))
      .then(() => setMessage("Sepete eklendi."));
  };

  const handleFavorite = () => {
    if (!favorited) {
      // Favorilere ekle
      api.post(`products/${id}/favorite/`)
        .then(() => {
          setFavorited(true);
          setMessage("Favorilere eklendi.");
        })
        .catch((err) => {
          console.error("Favorilere ekleme hatası:", err);
          setMessage("Favorilere eklenemedi.");
        });
    } else {
      // Favoriden çıkar
      api.delete(`products/${id}/favorite/`)
        .then(() => {
          setFavorited(false);
          setMessage("Favorilerden çıkarıldı.");
        })
        .catch((err) => {
          console.error("Favoriden çıkarma hatası:", err);
          setMessage("Favorilerden çıkarılamadı.");
        });
    }
  };

  const handleRating = (rate) => {
    if (rate) setUserRating(rate);
    api.post(`products/${id}/rate/`, { rating: rate })
      .then((res) => {
        if (res.data && res.data.update_average_rating) {
          setAverageRating(res.data.update_average_rating);
        }
        setMessage(`Puanınız: ${rate} yıldız olarak kaydedildi.`);
      })
      .catch((err) => {
        console.error("Puanlama hatası:", err);
        setMessage("Puan verilemedi.");
      });
  };

  const submitReview = async () => {
    if (!userRating || !reviewText.trim()) {
      alert("Puan ve yorum gerekli.");
      return;
    }
    try {
      await api.post(`products/${id}/reviews/`, {
        rating: userRating,
        comment: reviewText,
      });
      setReviewText("");
      setUserRating(0);
      setMessage("Yorumunuz kaydedildi.");
      await fetchData(); // listeyi yenile
    } catch (err) {
      console.error("Yorum gönderme hatası:", err);
      setMessage("Yorum kaydedilemedi.");
    }
  };

  const submitQuestion = async () => {
    if (!questionText.trim()) {
      alert("Soru boş olamaz.");
      return;
    }
    try {
      await api.post(`products/${id}/qa/`, { question: questionText });
      setQuestionText("");
      setMessage("Sorunuz gönderildi.");
      await fetchData(); // listeyi yenile
    } catch (err) {
      console.error("Soru gönderme hatası:", err);
      setMessage("Soru gönderilemedi.");
    }
  };

  if (!product) {
    return (
      <Container className="mt-4">
        <h2>Ürün bulunamadı veya yükleniyor...</h2>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {message && <Alert variant="info">{message}</Alert>}
      <Row>
        <Col md={6}>
          <img
            src={`${API_BASE}${product.image ?? ""}`}
            alt={product.name || "Ürün görseli"}
            className="img-fluid"
            onError={(e) => {
              e.currentTarget.src = "/images/product-placeholder.png";
            }}
          />
        </Col>

        <Col md={6}>
          <Tabs defaultActiveKey="description" id="my-tabs" className="mb-3">
            <Tab eventKey="description" title="Ürün Açıklaması">
              <Card>
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <div className="card-text">
                    <p>
                      <strong>Açıklama:</strong> {product.description}
                    </p>
                    <p>
                      <strong>Fiyat:</strong> {product.price} ₺
                    </p>
                    <p>
                      <strong>Stok:</strong> {product.count_in_stock}
                    </p>
                    <p>
                      <strong>Ortalama Puan:</strong> {averageRating} ⭐
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="reviews" title="Değerlendirmeler">
              <div className="mb-3">
                <strong>Sizin Puanınız:</strong>{" "}
                {renderStars(userRating, true, handleRating)}
              </div>

              <ProductReviewsTab
                reviews={reviews}
                userRating={userRating}
                reviewText={reviewText}
                onRatingChange={handleRating}
                onReviewTextChange={setReviewText}
                onSubmitReview={submitReview}
              />
            </Tab>

            <Tab eventKey="qa" title="Soru & Cevap">
              <ListGroup variant="flush">
                {questions.length === 0 ? (
                  <ListGroup.Item>Henüz soru yok.</ListGroup.Item>
                ) : (
                  questions.map((qa, idx) => (
                    <ListGroup.Item key={idx}>
                      <strong>{qa.user}</strong>: {qa.question}
                      {qa.answer && (
                        <div className="text-muted mt-1">
                          Cevap: {qa.answer}
                        </div>
                      )}
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>

              <Form className="mt-4">
                <h5>Soru Sor</h5>
                <Form.Group className="mb-2" controlId="questionText">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Sorunuzu yazın..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </Form.Group>
                <Button variant="outline-primary" onClick={submitQuestion}>
                  Soruyu Gönder
                </Button>
              </Form>
            </Tab>
          </Tabs>

          <div className="d-flex gap-2 my-3 flex-wrap">
            <div className="d-flex gap-3 my-3 flex-wrap">
              <span
                style={{
                  cursor: "pointer",
                  fontSize: "1.6rem",
                  color: "#28a745",
                }}
                onClick={handleAddToCart}
                title="Sepete Ekle"
              >
                <FaShoppingCart />
              </span>
              <span
                style={{
                  cursor: "pointer",
                  fontSize: "1.6rem",
                  color: favorited ? "#dc3545" : "#ccc",
                }}
                onClick={handleFavorite}
                title={favorited ? "Favoriden Çıkar" : "Favoriye Ekle"}
              >
                {favorited ? <FaHeart /> : <FaRegHeart />}
              </span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetailsKopya;
