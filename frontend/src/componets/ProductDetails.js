// src/pages/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { selectIsFavorited, addFavorite, removeFavorite,fetchFavorites } from "../redux/favoritesSlice";

function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const favorites = useSelector((s) => s.favorites.items);

  const base_url = "http://localhost:8000/api";

  const [product, setProduct] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [message, setMessage] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);

  const isFavorited = useSelector((state) => selectIsFavorited(state, productId));
  console.log(isFavorited);
  console.log(id);
  console.log(product);

  const fetchData = async () => {
    try {
      const [productRes, userRatingRes, reviewsRes, questionsRes] =
        await Promise.all([
          // PUBLIC
          axios.get(`${base_url}/products/${id}/`),

          // AUTH (sadece girişliyse)
          isLoggedIn
            ? api.get(`products/${id}/user-rating/`)
            : Promise.resolve({ data: { rating: 0 } }),

          // PUBLIC
          axios.get(`${base_url}/products/${id}/reviews/`),
          axios.get(`${base_url}/products/${id}/qa/`),
        ]);

      const pd = productRes?.data ?? {};
      setProduct(pd);
      setAverageRating(pd?.rating ?? 0);
      setUserRating(userRatingRes?.data?.rating ?? 0);
      setReviews(Array.isArray(reviewsRes?.data) ? reviewsRes.data : []);
      setQuestions(Array.isArray(questionsRes?.data) ? questionsRes.data : []);
    } catch (err) {
      console.error("Veriler alınırken hata oluştu:", err);
      setMessage("Veriler alınamadı.");
    }
  };

  // İlk yükleme + login durumu değiştiğinde (kullanıcı puanı vs. için)
  useEffect(() => {
    fetchData();
  }, [id, isLoggedIn]);

  // Favoriler: sayfa açıldığında ya da login değiştiğinde güncel olsun
  useEffect(() => {
    dispatch(fetchFavorites([productId]));
  }, [dispatch, isLoggedIn]);

  const handleAddToCart = () => {
    if (!product?.id) return;

    // Guest ise localStorage, login ise API — slice halledecek
    dispatch(
      addToCart({
        product_id: product.id,
        quantity: 1,
        // Guest modda kart özetinde göstermek için faydalı
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
        if (isLoggedIn) dispatch(fetchCart()); // server modda senkron olsun
        setMessage("Sepete eklendi.");
      })
      .catch(() => setMessage("Sepete eklenemedi."));
  };

  const handleFavorite = async () => {
  if (!product?.id) return;

  try {
    if (isFavorited) {
      // Ürün favorideyse: sil
      await dispatch(removeFavorite({ product_id: product.id })).unwrap();
      setMessage("Favorilerden çıkarıldı.");
    } else {
      // Ürün favoride değilse: ekle
      await dispatch(
        addFavorite({
          product_id: product.id,
          // guest görünümünde hızlı render için
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

    // Sunucu modunda eşitlenmesi için (guest'te da sorun olmaz)
    dispatch(fetchFavorites([productId]));
  } catch (err) {
    setMessage("İşlem başarısız.");
    console.error(err);
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

  const submitReview = () => {
    if (!isLoggedIn) return alert("Yorum için giriş yapmalısınız.");
    if (!userRating || !reviewText.trim())
      return alert("Puan ve yorum gerekli.");
    api
      .post(`products/${id}/reviews/`, {
        rating: userRating,
        comment: reviewText,
      })
      .then(() => {
        setReviewText("");
        setUserRating(0);
        fetchData();
      })
      .catch(console.error);
  };

  const submitQuestion = () => {
    if (!isLoggedIn) return alert("Soru sormak için giriş yapmalısınız.");
    if (!questionText.trim()) return alert("Soru boş olamaz.");
    api
      .post(`products/${id}/qa/`, { question: questionText })
      .then(() => {
        setQuestionText("");
        fetchData();
      })
      .catch(console.error);
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
            src={`http://localhost:8000${product.image}`}
            alt={product.name || product.title}
            className="img-fluid"
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
