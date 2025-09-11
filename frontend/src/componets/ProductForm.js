import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Card, Image } from "react-bootstrap";

function ProductForm({ onAdd, onUpdate, selectedProduct, clearSelected }) {
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    image: '', // Dosya yolu veya base64
    description: '',
    brand: '',
    category: '',
    price: '',
    countInStock: '',
    rating: '',
    numReviews: '',
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      setFormData(selectedProduct);
      setImagePreview(selectedProduct.image);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedData = {
      ...formData,
      price: parseFloat(formData.price),
      countInStock: parseInt(formData.countInStock),
      rating: parseFloat(formData.rating),
      numReviews: parseInt(formData.numReviews),
    };
    if (selectedProduct) {
      onUpdate(parsedData);
      clearSelected();
    } else {
      onAdd(parsedData);
    }
    setFormData({
      _id: '',
      name: '',
      image: '',
      description: '',
      brand: '',
      category: '',
      price: '',
      countInStock: '',
      rating: '',
      numReviews: '',
    });
    setImagePreview(null);
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title>{selectedProduct ? 'Ürünü Güncelle' : 'Yeni Ürün Ekle'}</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Row>
            {Object.entries(formData).map(([key, value], index) => {
              if (key === 'image') return null; // image input'u ayrı yapıyoruz
              return (
                <Col md={6} key={key} className="mb-3">
                  <Form.Group controlId={`form${key}`}>
                    <Form.Label>{key}</Form.Label>
                    <Form.Control
                      type="text"
                      name={key}
                      placeholder={`${key} giriniz`}
                      value={value}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              );
            })}

            {/* Resim yükleme alanı */}
            <Col md={12} className="mb-3">
              <Form.Group controlId="formImageUpload">
                <Form.Label>Ürün Resmi</Form.Label>
                <Form.Control type="file" accept="resources/images/" onChange={handleImageChange} />
              </Form.Group>
              {imagePreview && (
                <div className="mt-2">
                  <Form.Label>Önizleme:</Form.Label>
                  <Image src={imagePreview} alt="preview" fluid rounded />
                </div>
              )}
            </Col>
          </Row>

          <div className="d-flex gap-2">
            <Button type="submit" variant="primary">
              {selectedProduct ? 'Güncelle' : 'Ekle'}
            </Button>
            {selectedProduct && (
              <Button variant="secondary" onClick={clearSelected}>
                İptal
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ProductForm;
