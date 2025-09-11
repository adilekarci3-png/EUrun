import React, { useState } from 'react';
import ProductForm from './ProductForm';
import ProductList from './ProductList'; // ProductListPage değil, direkt liste bileşeni
import productsData from '../data/products';

function ProductFormPage() {
  const [products, setProducts] = useState(productsData);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAdd = (product) => {
    const newProduct = { ...product, _id: Date.now().toString() }; // benzersiz id
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdate = (updatedProduct) => {
    setProducts(prev =>
      prev.map(product =>
        product._id === updatedProduct._id ? updatedProduct : product
      )
    );
  };

  const handleDelete = (id) => {
    setProducts(prev => prev.filter(product => product._id !== id));
  };

  const clearSelected = () => setSelectedProduct(null);

  return (
    <div className="container mt-4">
      <h2>Ürün Yönetimi</h2>
      <ProductForm
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        selectedProduct={selectedProduct}
        clearSelected={clearSelected}
      />
      <ProductList
        products={products}
        onEdit={setSelectedProduct}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ProductFormPage;
