import React, { useEffect, useState } from "react";
import { Col, Card, Button, Container, Row } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { api } from "../redux/authSlice";
import axios from "axios";

function Product() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("search") || "";

  // const API_BASE = "http://localhost:8000/api";
  // (import.meta?.env && import.meta.env.VITE_API_BASE) ||
  // process.env.REACT_APP_API_BASE ||
  

  // const api = axios.create({ baseURL: API_BASE });
 
useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        // Hepsini aynı anda çekmek daha hızlı
        const [pRes, bRes, cRes] = await Promise.all([
          api.get("/products/", { signal: controller.signal }),
          api.get("/brands/", { signal: controller.signal }),
          api.get("/categories/", { signal: controller.signal }),
        ]);
        if (cancelled) return;
        setProducts(pRes.data || []);
        setBrands(bRes.data || []);
        setCategories(cRes.data || []);
      } catch (e) {
        if (!cancelled) {
          console.error("Listeleme hatası:", e);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const filtered = products.filter((p) =>
      (p.name || "").toLowerCase().includes(searchQuery)
    );
    setFilteredProducts(filtered);
  }, [products, searchQuery]);


  return (
    <Container className="mt-4">
      <h1>Ürünler</h1>
      {searchQuery && (
        <p>
          <strong>Arama:</strong> "{searchQuery}"
        </p>
      )}
      <Row>
        {filteredProducts.map((product) => (
          <Col key={product.id} sm={12} md={6} lg={4} className="mb-4">
            <Card style={{ width: "100%" }}>
              <Card.Img
                variant="top"
                src={`http://localhost:8000${product.image}`}
                alt={product.name}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>{product.description}</Card.Text>
                <Card.Text>
                  <strong>Fiyat:</strong> ${product.price}
                </Card.Text>
                <Card.Text>
                  <strong>Puan:</strong> {product.rating} ⭐
                </Card.Text>
                <Card.Text>
                  <strong>Marka:</strong>{" "}
                  {brands.find((b) => b.id === product.brand)?.name || "-"}
                </Card.Text>
                <Card.Text>
                  <strong>Kategori:</strong>{" "}
                  {categories.find((c) => c.id === product.category)?.name || "-"}
                </Card.Text>
                <Button variant="primary" href={`/products/${product.id}`}>
                  Ürünü İncele
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Product;
