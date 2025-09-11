import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, removeFromCart } from "../redux/cartSlice";
import { FaTimes } from "react-icons/fa"; // X ikonu için

const Cart = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
    console.log(items);
  }, [dispatch]);

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const calculateTotal = () => {
    return items
      .reduce((acc, item) => acc + item.product.price * item.quantity, 0)
      .toFixed(2);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h2>🛒 Sepet</h2>
      {loading && <p>Yükleniyor...</p>}
      {items.length === 0 && <p>Sepetiniz boş.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #ccc",
              padding: "1rem 0",
            }}
          >            
            <img
              src={`http://localhost:8000${item.product.image}`}
              alt={item.product.name}
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                marginRight: "1rem",
              }}
            />            
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>{item.product.name}</h4>
              <p style={{ margin: "4px 0" }}>Fiyat: {item.product.price}₺</p>
              <p style={{ margin: "4px 0" }}>Adet: {item.quantity}</p>
              <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                Toplam: {(item.product.price * item.quantity).toFixed(2)}₺
              </p>
            </div>

            {/* Silme butonu */}
            <button
              // onClick={() => handleRemove(item.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item.id);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                color: "red",
              }}
              title="Ürünü sepetten çıkar"
            >
              <FaTimes />
            </button>
          </li>
        ))}
      </ul>

      {/* Sepet Toplamı */}
      {items.length > 0 && (
        <div
          style={{
            textAlign: "right",
            marginTop: "2rem",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          Genel Toplam: {calculateTotal()}₺
        </div>
      )}
    </div>
  );
};

export default Cart;
