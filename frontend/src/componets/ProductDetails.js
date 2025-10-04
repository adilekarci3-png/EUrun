// src/pages/ProductDetail.jsx
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
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { FaShoppingCart, FaHeart, FaRegHeart } from "react-icons/fa";

import { api, selectIsLoggedIn } from "../redux/authSlice";
import { addToCart, fetchCart } from "../redux/cartSlice";
import { renderStars } from "../utils/renderStars";
import {
  selectIsFavorited,
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from "../redux/favoritesSlice";

function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isFavorited = useSelector((state) => selectIsFavorited(state, productId));

  // .env desteği: REACT_APP_API_BASE yoksa localhost
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
  const PUBLIC_API = `${API_BASE}/api`;

  const [product, setProduct] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [message, setMessage] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Mesajları 3sn sonra temizle
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // ---- DATA FETCH (stable) ----
  const fetchData = useCallback(
    async (signal) => {
      const [productRes, userRatingRes, reviewsRes, questionsRes] =
        await Promise.all([
          // PUBLIC
          axios.get(`${PUBLIC_API}/products/${id}/`, { signal }),

          // AUTH (sadece girişliyse)
          isLoggedIn
            ? api.get(`products/${id}/user-rating/`, { signal })
            : Promise.resolve({ data: { rating: 0 } }),

          // PUBLIC
          axios.get(`${PUBLIC_API}/products/${id}/reviews/`, { signal }),
          axios.get(`${PUBLIC_API}/products/${id}/qa/`, { signal }),
        ]);

      const pd = productRes?.data ?? {};
      setProduct(pd);
      setAverageRating(pd?.rating ?? 0);
      setUserRating(userRatingRes?.data?.rating ?? 0);
      setReviews(Array.isArray(reviewsRes?.data) ? reviewsRes.data : []);
      setQuestions(Array.isArray(questionsRes?.data) ? questionsRes.data : []);
    },
    [id, isLoggedIn, PUBLIC_API]
  );

  // İlk yükleme + login değişince (kullanıcı puanı vs.)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        await fetchData(controller.signal);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Veriler alınırken hata oluştu:", err);
        setMessage("Veriler alınamadı.");
      }
    })();
    return () => controller.abort();
  }, [fetchData]);

  // Favoriler: sayfa açıldığında / login değiştiğinde / ürün değiştiğinde
  useEffect(() => {
    if (!Number.isFinite(productId)) return;
    dispatch(fetchFavorites([productId]));
  }, [dispatch, isLoggedIn, productId]);

  const handleAddToCart = () => {
    if (!product?.id) return;

    dispatch(
      addToCart({
        product_id: product.id,
        quantity: 1,
        // Guest modda kart özetinde hızlı render için
        product: {
          id: product.id,
          title: product.name,
          image: product.image,
          price: product.price,
        },
      })
    )
      .unwrap()
      .then(() => {
        if (isLoggedIn) dispatch(fetchCart());
        setMessage("Sepete eklendi.");
      })
      .catch(() => setMessage("Sepete eklenemedi."));
  };

  const handleFavorite = async () => {
    if (!product?.id) return;
    try {
      if (isFavorited) {
        await dispatch(removeFavorite({ product_id: product.id })).unwrap();
        setMessage("Favorilerden çıkarıldı.");
      } else {
        await dispatch(
          addFavorite({
            product_id: product.id,
            product: {
              id: product.id,
              title: product.name,
              image: product.image,
              price: product.price,
            },
          })
        ).unwrap();
        setMessage("Favorilere eklendi.");
      }
      dispatch(fetchFavorites([productId]));
    } catch (err) {
      console.error(err);
      setMessage("İşlem başarısız.");
    }
  };

  const handleRating = (rate) => {
    if (!isLoggedIn) return setMessage("Puan vermek için giriş yapmalısınız.");
    if (rate) setUserRating(rate);

    api
      .post(`products/${id}/rate/`, { rating: rate })
      .then((res) => {
        const updated = res?.data?.update_average_rating;
        if (typeof updated === "number") setAverageRating(updated);
        setMessage(`Puanınız kaydedildi: ${rate} ⭐`);
      })
      .catch(() => setMessage("Puan verilemedi."));
  };

  const submitReview = async () => {
    if (!isLoggedIn) return alert("Yorum için giriş yapmalısınız.");
    if (!userRating || !reviewText.trim()) return alert("Puan ve yorum gerekli.");
    try {
      await api.post(`products/${id}/reviews/`, {
        rating: userRating,
        comment: reviewText,
      });
      setReviewText("");
      setUserRating(0);
      await fetchData(); // listeyi yenile
      setMessage("Yorumunuz kaydedildi.");
    } catch (err) {
      console.error(err);
      setMessage("Yorum kaydedilemedi.");
    }
  };

  const submitQuestion = async () => {
    if (!isLoggedIn) return alert("Soru sormak için giriş yapmalısınız.");
    if (!questionText.trim()) return alert("Soru boş olamaz.");
    try {
      await api.post(`products/${id}/qa/`, { question: questionText });
      setQuestionText("");
      await fetchData(); // listeyi yenile
      setMessage("Sorunuz gönderildi.");
    } catch (err) {
      console.error(err);
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
            alt={product.name || product.title || "Ürün görseli"}
            className="img-fluid"
            onError={(e) => {
              e.currentTarget.src = "/images/product-placeholder.png";
            }}
          />
        </Col>
        <Col md={6}>
          <Tabs defaultActiveKey="description" id="product-tabs" className="mb-3">
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

              <ListGroup variant="flush">
                {reviews.length === 0 ? (
                  <ListGroup.Item>Henüz Yorum Yok</ListGroup.Item>
                ) : (
                  reviews.map((rev, i) => (
                    <ListGroup.Item key={i}>
                      <strong>{rev.user}</strong>: {rev.comment} ({rev.rating} ⭐)
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>

              <Form className="mt-4">
                <h5>Yorum Ekle</h5>
                <Form.Group className="mb-2" controlId="reviewText">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Yorumunuzu yazın..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" onClick={submitReview}>
                  Gönder
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="qa" title="Soru & Cevap">
              <ListGroup variant="flush">
                {questions.length === 0 ? (
                  <ListGroup.Item>Henüz soru yok.</ListGroup.Item>
                ) : (
                  questions.map((qa, i) => (
                    <ListGroup.Item key={i}>
                      <strong>{qa.user}</strong>: {qa.question}
                      {qa.answer && <div className="text-muted mt-1">Cevap: {qa.answer}</div>}
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

          <div className="d-flex gap-3 my-3 flex-wrap">
            <span
              style={{ cursor: "pointer", fontSize: "1.6rem", color: "#28a745" }}
              onClick={handleAddToCart}
              title="Sepete Ekle"
            >
              <FaShoppingCart />
            </span>
            <span
              style={{
                cursor: "pointer",
                fontSize: "1.6rem",
                color: isFavorited ? "#dc3545" : "#ccc",
              }}
              onClick={handleFavorite}
              title={isFavorited ? "Favoriden Çıkar" : "Favoriye Ekle"}
            >
              {isFavorited ? <FaHeart /> : <FaRegHeart />}
            </span>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetail;
