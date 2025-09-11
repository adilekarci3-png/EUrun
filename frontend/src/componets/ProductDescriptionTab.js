import React from "react";
import { Card } from "react-bootstrap";

const ProductDescriptionTab = ({ product, averageRating }) => {
  if (!product) return null;

  return (
   <Card>
  <Card.Body>
    <Card.Title>{product.name}</Card.Title>
    <div className="card-text">
      <p><strong>Açıklama:</strong> {product.description}</p>
      <p><strong>Fiyat:</strong> {product.price} ₺</p>
      <p><strong>Stok:</strong> {product.count_in_stock}</p>
      <p><strong>Ortalama Puan:</strong> {averageRating} ⭐</p>
    </div>
  </Card.Body>
</Card>
  );
};

export default ProductDescriptionTab;
