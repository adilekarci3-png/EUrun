import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "../redux/cartSlice";
import {
  Container,
  Nav,
  Navbar,
  Form,
  Button,
  NavDropdown,
  Overlay,
  Popover,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./css/header.css";
import { FaShoppingCart } from "react-icons/fa";
import Cart from "./Cart";
import { logout, selectIsLoggedIn, hasRole } from "../redux/authSlice";
import HeaderBell from "./HeaderBell";

/** --- JWT helper'ları --- **/
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getAccessTokenFromStorage() {
  debugger;
  try {
    const authData = localStorage.getItem("auth");
    debugger;
    if (!authData) return "";

    const parsed = JSON.parse(authData);
    return parsed?.access || "";
  } catch (e) {
    console.error("Token parse error:", e);
    return "";
  }
}

function getRolesFromTokenFallback() {
  const t = getAccessTokenFromStorage();
  if (!t) return [];
  const payload = parseJwt(t);
  const raw = payload?.roles ?? payload?.role ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  // Türkçe karakter ve olası encode sorunlarına karşı normalize:
  return list
    .filter(Boolean)
    .map((r) => (typeof r === "string" ? r.normalize("NFC") : String(r)));
}

function Header() {
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const target = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Sepet
  const cartItems = useSelector((state) => state.cart.items || []);
  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin = useSelector(hasRole("Yönetici")); // şapkalı/şapkasız normalize ediyor
  const isFirma = useSelector(hasRole("Firma"));

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCart());
    }
  }, [dispatch, isLoggedIn]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  const handleLogout = () => {
    // state + localStorage + Authorization header temizlenir
    dispatch(logout());
    setShow(false); // açık bir popover varsa kapatmak için
    navigate("/");
  };

  const cartPopup = (
    <Popover id="cart-popover" style={{ minWidth: "500px" }}>
      <Popover.Header as="h5">Sepetim</Popover.Header>
      <Popover.Body>
        {cartItems.length === 0 ? <div>Sepetiniz boş.</div> : <Cart />}
        <div className="text-end mt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShow(false);
              navigate("/cart");
            }}
          >
            Sepete Git
          </Button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <Navbar
      expand="lg"
      className="custom-navbar shadow-sm py-3"
      variant="light"
    >
      <Container>
        <Navbar.Brand
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", fontWeight: "bold", fontSize: "1.4rem" }}
        >
          🛒 E-Urun
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav className="me-auto align-items-center">
            <Nav.Link onClick={() => navigate("/")}>Ana Sayfa</Nav.Link>
            <Nav.Link onClick={() => navigate("/about")}>Hakkımızda</Nav.Link>
<Nav className="ms-auto">
          <HeaderBell />
        </Nav>
            {/* Genel Ürünler menüsü - herkes görebilir */}
            <NavDropdown title="Ürünler" id="urunler-dropdown">
              {/* Firma veya Admin yetkisi olanlara "Yeni Ürün" göster */}
              {(isFirma || isAdmin) && (
                <NavDropdown.Item onClick={() => navigate("/products/new")}>
                  Yeni Ürün Ekle
                </NavDropdown.Item>
              )}
              <NavDropdown.Item onClick={() => navigate("/productlist2")}>
                Ürün Listesi
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => navigate("/products")}>
                Güncel Ürünler
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/dashboard")}>
                Grafikler
              </NavDropdown.Item>
            </NavDropdown>

            {/* Sadece Yönetici (Admin) menüsü */}
            {isAdmin && (
              <NavDropdown title="Yönetim" id="yonetim-dropdown">
                <NavDropdown.Item onClick={() => navigate("/admin/users")}>
                  Kullanıcılar
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/admin/roles")}>
                  Roller
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/admin/orders")}>
                  Sipariş Yönetimi
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/admin/reports")}>
                  Raporlar
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => navigate("/admin/settings")}>
                  Sistem Ayarları
                </NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Sadece Firma menüsü */}
            {isFirma && !isAdmin && (
              <NavDropdown title="Firma" id="firma-dropdown">
                <NavDropdown.Item onClick={() => navigate("/vendor/products")}>
                  Ürünlerim
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => navigate("/vendor/new-product")}
                >
                  Yeni Ürün Oluştur
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/vendor/orders")}>
                  Siparişlerim
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/vendor/earnings")}>
                  Kazançlar
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => navigate("/vendor/settings")}>
                  Mağaza Ayarları
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          <Form className="d-flex me-3" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder="Ürün ara..."
              className="me-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="success" type="submit">
              Ara
            </Button>
          </Form>
          <div
            ref={target}
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => setShow(!show)}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              <FaShoppingCart style={{ fontSize: "1.6rem", color: "#ff4757", margin: "0 8px" }} />
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-10px",
                    background: "#ff4757", // istersen var(--bs-danger)
                    color: "#fff",
                    borderRadius: "999px",
                    minWidth: 18,
                    height: 18,
                    padding: "0 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "2px solid #fff", // <-- header ile aynı olsa bile görünür
                    boxShadow: "0 0 0 2px rgba(0,0,0,.05)",
                    zIndex: 2,
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </div>
          </div>

          <Overlay
            target={target.current}
            show={show}
            placement="bottom"
            rootClose
            onHide={() => setShow(false)}
          >
            {cartPopup}
          </Overlay>
          {!isLoggedIn ? (
            <>
              <Button
                variant="outline-primary"
                className="me-2"
                onClick={() => navigate("/register")}
              >
                Kayıt Ol
              </Button>
              <Button variant="primary" onClick={() => navigate("/giris")}>
                Giriş Yap
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline-danger"
                className="me-2"
                onClick={handleLogout}
              >
                Çıkış
              </Button>
              <Button
                variant="primary"
                className="me-2"
                onClick={() => navigate("/profile")}
              >
                Profil
              </Button>

              {/* 🛒 Sepet Butonu */}
            </>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
