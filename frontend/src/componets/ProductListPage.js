// import React, { useState,useEffect } from "react";
// import ProductList from "./ProductList";
// import { Container } from "react-bootstrap";
// import axios from "axios";

// function ProductListPage() {
//   const [products, setProducts] = useState([]);

//   console.log(products);
//  useEffect(() => {
//     axios
//       .get('http://localhost:8000/api/products/')
//       .then((res) => {
//         console.log(res.data);
//         setProducts(res.data);
//       })
//       .catch((err) => {
//         console.error('Ürün verisi çekilemedi:', err)
//       })
//   }, [])
//   const handleDelete = (id) => {
//     setProducts(products.filter((p) => p._id !== id));
//   };
  
//   const handleEdit = (product) => {
//     alert(`Düzenlenecek Ürün:${product.name}`);
//   };
//   return (
//     <>
//       <Container className="mt-4">
//         <h3>Ürün Listesi</h3>
//         <ProductList
//           products={products}
//           onEdit={handleEdit}
//           onDelete={handleDelete}
//         />
//       </Container>
//     </>
//   );
// }

// export default ProductListPage;
