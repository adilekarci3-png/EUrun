import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addNotification, fetchNotifications } from "../redux/notificationsSlice";
import { Container, Form, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ProductCreate({ initialData = {}, onSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // const data = initialData || {};
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

  // console.log(formData);
  const handleChange = (e) => {
    
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm({ ...formData, [name]: files[0] });
    } else {
      setForm({ ...formData, [name]: value });
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

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm({
        id: initialData.id ?? 0,
        name: initialData.name || "",
        price: initialData.price || "",
        count_in_stock: initialData.count_in_stock || "",
        category: initialData.category || "",
        brand: initialData.brand || "",
        description: initialData.description || "",
        rating: initialData.rating || 0,
        num_reviews: initialData.num_reviews || 0,
        image: initialData.image || null,
      });
    }
  }, [initialData]);  

  const handleSubmit = async (e) => {
    
    e.preventDefault();

    try {
      const data = new FormData();      
      for (const key in formData) {        
        if (key === "image") {
          // Eğer File ise FormData'ya ekle
          if (formData["image"] instanceof File) {
            data.append("image", formData["image"]);
          }
          // Eğer string ise (yani mevcut görsel yolu) -> API'ye eklemeye gerek yok
        } else {
          data.append(key, formData[key]);
        }
      }

      if (formData["id"]) {
        

        await axios.put(
          `http://localhost:8000/api/products/${formData["id"]}/update/`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        Swal.fire("Başarılı", "Ürün güncellendi", "success");
        // ✅ HEADER bildirimi
        dispatch(
          addNotification({
            channel: "header",
            type: "success",
            title: "Ürün güncellendi",
            message: `"${formData.name}" güncellendi.`,
          })
        );
      } else {
        // EKLEME
        await axios.post("http://localhost:8000/api/products/create/", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire("Başarılı", "Yeni ürün eklendi", "success");
        // ✅ HEADER bildirimi
        dispatch(
          addNotification({
            channel: "header",
            type: "success",
            title: "Yeni ürün eklendi",
            message: `"${formData.name}" başarıyla eklendi.`,
          })
        );
      }
      onSuccess?.(); // popup'ı kapat ve listeyi yenile
    } catch (err) {
      console.error(err);
      Swal.fire("Hata", "İşlem başarısız", "error");
      dispatch(
        addNotification({
          channel: "header",
          type: "error",
          title: "İşlem başarısız",
          message: err,
        })
      );
    }
  };
  return (
    <>
      <Container className="mt-4">
        <Form>
          <Form.Group className="mb-3" controlId="formBasicAd">
            <Form.Label>Ürün Adı</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ürün Adını Giriniz"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <Form.Text className="text-muted"></Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Açıklama</Form.Label>
            <Form.Control
              type="textarea"
              rows={5}
              value={formData.description}
              name="description"
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Marka</Form.Label>
            <Form.Select
              name="brand"
              onChange={handleChange}
              value={formData.brand}
            >
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
            <Form.Select
              name="category"
              onChange={handleChange}
              value={formData.category}
            >
              <option value="">Kategori Seç</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Fiyat</Form.Label>
            <Form.Control
              type="number"
              placeholder="Fiyat Giriniz"
              name="price"
              value={formData.price}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Stok</Form.Label>
            <Form.Control
              type="number"
              placeholder="Stok Giriniz"
              name="count_in_stock"
              value={formData.count_in_stock}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Rating</Form.Label>
            <Form.Control
              type="number"
              placeholder="Rating"
              value={formData.rating}
              name="rating"
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Beğeni</Form.Label>
            <Form.Control
              type="number"
              placeholder="Beğeni"
              value={formData.num_reviews}
              name="num_reviews"
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ürün Görseli</Form.Label>
            {typeof formData.image === "string" && (
              <div className="mb-2">
                <img
                  src={`http://localhost:8000${formData.image}`}
                  alt="Mevcut Görsel"
                  style={{ maxWidth: "200px", borderRadius: "4px" }}
                />
              </div>
            )}
            <Form.Control
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            Kayıt Ol
          </Button>
        </Form>
      </Container>
    </>
  );
}

export default ProductCreate;
