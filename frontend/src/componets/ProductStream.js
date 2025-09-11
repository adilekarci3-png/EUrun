// import React, { useEffect, useState } from "react";
// import { Bar } from "react-chartjs-2";
// import { DataGrid } from "@mui/x-data-grid";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// function ProductStream() {
//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     const socket = new WebSocket("ws://localhost:8000/ws/products/");

//     socket.onmessage = (e) => {
//       const data = JSON.parse(e.data);
//       if (data.event === "new_product") {
//         setProducts((prev) => [data.data, ...prev]);
//       }
//     };

//     return () => socket.close();
//   }, []);

//   const columns = [
//     { field: "id", headerName: "ID", width: 70 },
//     { field: "name", headerName: "Ürün Adı", width: 150 },
//     {
//       field: "image",
//       headerName: "Görsel",
//       width: 100,
//       renderCell: (params) => (
//         <img
//           src={params.value}
//           alt="Ürün"
//           style={{ width: 50, height: 50, objectFit: "cover" }}
//         />
//       ),
//     },
//     { field: "brand", headerName: "Marka", width: 130 },
//     { field: "category", headerName: "Kategori", width: 130 },
//     { field: "price", headerName: "Fiyat (₺)", width: 100 },
//     { field: "count_in_stock", headerName: "Stok", width: 80 },
//     { field: "rating", headerName: "Puan", width: 80 },
//     { field: "num_reviews", headerName: "Yorum", width: 80 },
//   ];

//   const chartData = {
//     labels: products.map((p) => p.name),
//     datasets: [
//       {
//         label: "Fiyat",
//         data: products.map((p) => p.price),
//         backgroundColor: "rgba(75, 192, 192, 0.5)",
//       },
//       {
//         label: "Puan",
//         data: products.map((p) => p.rating),
//         backgroundColor: "rgba(255, 99, 132, 0.5)",
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: { position: "top" },
//       title: { display: true, text: "Canlı Ürün Fiyat & Puan Grafiği" },
//     },
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h3>🛒 Canlı Ürün Listesi</h3>
//       <div style={{ height: 400, marginBottom: 40 }}>
//         <DataGrid
//           rows={products}
//           columns={columns}
//           pageSize={5}
//           getRowId={(row) => row.id}
//         />
//       </div>

//       <h3>📊 Ürün Fiyat ve Puan Grafiği</h3>
//       <Bar data={chartData} options={options} />
//     </div>
//   );
// }

// export default ProductStream;

import React, { useEffect, useState } from "react";

function ProductStream() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8001/ws/products/");

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === "new_product") {
        setProducts((prev) => [data.data, ...prev]);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div>
      <h3>Canlı Ürünler</h3>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name} - {p.price}₺</li>
        ))}
      </ul>
    </div>
  );
}

export default ProductStream;