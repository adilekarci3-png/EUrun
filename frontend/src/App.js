import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { attachAuthInterceptors } from "./redux/authSlice";

import MainLayout from "./layouts/MainLayout";
import Product from "./componets/Product";
import ProductFormPage from "./componets/ProductFormPage";
import ProductList from "./componets/ProductList";
import ProductList2 from "./componets/ProductList2";
import KullaniciKayit from "./componets/User/KullaniciKayit";
import LoginPage from "./componets/User/Login";
import GoogleLoginButton from "./componets/User/GoogleLoginButton";
import PasswordResetRequest from "./componets/User/PasswordResetRequest";
import PasswordResetConfirm from "./componets/User/PasswordResetConfirm";

import Cart from "./componets/Cart";
import ProductChartsDx from "./componets/ProductChartsDx";
import ProductDetail from "./componets/ProductDetails";
import Grafikler from "./componets/Grafikler";
import ProductCreate from "./componets/ProductCreate";
import KategoriMarkaEkle from "./componets/KategoriMarkaEkle";
import Profile from "./componets/User/Profile";
import SMSGiris from "./componets/User/SMSGiris";

import "./App.css";
import ProductDetailsKopya from "./componets/ProductDetailsKopya";
import FirmaList from "./componets/Firmalar/FirmaList";
import FirmaCreatePage from "./componets/Firmalar/FirmaCreatePage";
import SmartAssistant from "./componets/SmartAI/SmartAssistant";
import ProductStream from "./componets/ProductStream";
import DirectUpload from "./componets/DirectUpload";
import ChatBox from "./componets/ChatBox";

attachAuthInterceptors(store);

function App() {
  return (
    <Provider store={store}>
      <Router>
        <SmartAssistant />
        <Routes>
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/register" element={<KullaniciKayit />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/googleLogin" element={<GoogleLoginButton />} />
          <Route path="/password-reset" element={<PasswordResetRequest />} />
          <Route path="/sms-giris" element={<SMSGiris />} />
          <Route path="/reset-password/:uidb64/:token" element={<PasswordResetConfirm />} />
          <Route path="/chat" element={<ChatBox room="general" user="Adile" />} />
          <Route element={<MainLayout />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/" element={<Product />} />
            <Route path="/products" element={<Product />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/productKopya/:id" element={<ProductDetailsKopya />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/productlist" element={<ProductList />} />
            <Route path="/kategoriMarkaEkle" element={<KategoriMarkaEkle />} />
            <Route path="/dashboard" element={<ProductChartsDx />} />
            <Route path="/grafik" element={<Grafikler />} />
            <Route path="/productlist2" element={<ProductList2 />} />
            <Route path="/productCreate" element={<ProductCreate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upload" element={<DirectUpload />} />
            
            <Route path="/firmalar" element={<FirmaList />} />
            <Route path="/firma-create" element={<FirmaCreatePage />} />
            <Route path="/bildirim" element={<ProductStream />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;


