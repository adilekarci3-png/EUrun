import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductList from './ProductList';
import productsData from '../data/products';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ProductListPage() {
  const query = useQuery();
  const search = query.get('search')?.toLowerCase() || '';
  const [products, setProducts] = useState(productsData);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search)
  );

  const handleDelete = (id) => {
    setProducts(products.filter((p) => p._id !== id));
  };

  const handleUpdate = (product) => {
    alert(`Düzenlenecek ürün: ${product.name}`);
  };

  return (
    <div className="container mt-4">
      <h2>Ürün Listesi</h2>
      <ProductList
  products={products}
  onEdit={handleUpdate}
  onDelete={handleDelete}
/>
    </div>
  );
}

export default ProductListPage;
