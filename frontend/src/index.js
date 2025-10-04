
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './bootstrap.min.css';
import 'devextreme/dist/css/dx.light.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import "ckeditor5/ckeditor5.css"; 
import { store, applyAuthHeaderOnBoot } from "../src/componets/store/index";
import $ from 'jquery';
import axios from 'axios';
import { Provider } from 'react-redux';
window.$ = $;
window.jQuery = $;

const root = ReactDOM.createRoot(document.getElementById('root'));

// Basit yardımcı
function setAuthHeader(token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Rehydrate tamamlanınca header'ı kur
applyAuthHeaderOnBoot(setAuthHeader);

root.render(
  
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
