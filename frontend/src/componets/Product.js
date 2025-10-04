import React, { useEffect, useState } from "react";
import { Col, Card, Button, Container, Row } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { api } from "../redux/authSlice";

function Product() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("search") || "";

  const MINIO_ENDPOINT = "http://46.31.79.7:9000";
  const PUBLIC_BUCKET = "media-public";
  const API_BASE = "http://localhost:8000";

  const buildPublicImageUrl = (img) => {
    if (!img || typeof img !== "string") return "";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("/")) return `${API_BASE}${img}`;
    return `${MINIO_ENDPOINT}/${PUBLIC_BUCKET}/${img}`;
  };

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
        console.log("Ürün verisi:", pRes.data);
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
                src={buildPublicImageUrl(product.image)}
                alt={product.name}
                style={{ height: "200px", objectFit: "cover" }}
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
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
                  {categories.find((c) => c.id === product.category)?.name ||
                    "-"}
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
