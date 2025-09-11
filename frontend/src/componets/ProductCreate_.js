import React, { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ProductCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [formData, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    category: "",
    price: 0,
    count_in_stock: 0,
    rating: 0,
    num_reviews: 0,
    image: null, 
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm({ ...formData, [name]: files[0] });
    } else {
      setForm({ ...formData, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      for (let key in formData) {
        data.append(key, formData[key]);
      }

      await axios.post("http://localhost:8000/api/products/create/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire("Başarılı", "Ürün başarıyla eklendi", "success").then(() =>
        navigate("/products")
      );
    } catch (error) {
      console.error("Ürün eklenemedi:", error);
      Swal.fire("Hata", "Ürün eklenemedi", "error");
    }
  };

  useEffect(() => {
    axios.get("http://localhost:8000/api/categories/").then((res) => {
      setCategories(res.data);
    });
    axios.get("http://localhost:8000/api/brands/").then((res) => {
      setBrands(res.data);
    });
  }, []);

  return (
    <Container className="mt-4">
      <Form onSubmit={handleSave}>
        <Form.Group className="mb-3">
          <Form.Label>Ürün Adı</Form.Label>
          <Form.Control
            type="text"
            name="name"
            placeholder="Ürün adı giriniz"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Ürün Görseli</Form.Label>
          <Form.Control
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Açıklama</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="description"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Marka</Form.Label>
          <Form.Select name="brand" onChange={handleChange}>
            <option value="">Marka Seç</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Kategori</Form.Label>
          <Form.Select name="category" onChange={handleChange}>
            <option value="">Kategori Seç</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Fiyat</Form.Label>
          <Form.Control
            type="number"
            name="price"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Stok</Form.Label>
          <Form.Control
            type="number"
            name="count_in_stock"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Rating</Form.Label>
          <Form.Control
            type="number"
            name="rating"
            step="0.1"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Beğeni Sayısı</Form.Label>
          <Form.Control
            type="number"
            name="num_reviews"
            onChange={handleChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Kaydet
        </Button>
      </Form>
    </Container>
  );
}

export default ProductCreate;
