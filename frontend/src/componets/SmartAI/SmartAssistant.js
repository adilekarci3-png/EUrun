import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "../css/assistant.css";

function SmartAssistant() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("tr");
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const chatRef = useRef(null);

  const { items, loading } = useSelector((state) => state.cart);

  const handleAsk = async () => {
    if (!query.trim()) return;

    try {
      const res = await axios.post("http://localhost:8000/api/assistant/ask/", {
        question: query,
        language: language,
      });
      const answer = res.data.answer;

      setMessages((prev) => [...prev, { q: query, a: answer }]);
    } catch (err) {
      console.error("Yapay zeka cevabı alınamadı:", err);
      const fallback = language === "tr"
        ? "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
        : "Something went wrong. Please try again later.";
      setMessages((prev) => [...prev, { q: query, a: fallback }]);
    }

    setQuery("");
  };

  const handleCategoryClick = async (category) => {
    if (category === "cart") {
      const question = language === "tr" ? "Sepetimde kaç ürün var?" : "How many items are in my cart?";

      if (loading) {
        setMessages((prev) => [...prev, { q: question, a: "Sepet yükleniyor..." }]);
        return;
      }

      if (!items || items.length === 0) {
        const emptyMsg = language === "tr" ? "Sepetinizde ürün bulunmamaktadır." : "Your cart is empty.";
        setMessages((prev) => [...prev, { q: question, a: emptyMsg }]);
        return;
      }

      const answer = items
        .map(
          (item, i) =>
            `${i + 1}. ${item.product?.name || "Ürün adı yok"} (${item.quantity} adet) - ${item.product?.price || 0}₺`
        )
        .join("\n");

      setMessages((prev) => [...prev, { q: question, a: answer }]);
      return;
    }

    // Diğer kategoriler veritabanından çekilir
    try {
      const res = await axios.get(`http://localhost:8000/api/assistant/qa/category/?category=${category}&lang=${language}`);
      const { question, answer } = res.data;
      setMessages((prev) => [...prev, { q: question, a: answer }]);
    } catch (err) {
      console.error("Kategori verisi alınamadı:", err);
      const fallback = language === "tr"
        ? "Bu kategoriye ait bilgi bulunamadı."
        : "No information found for this category.";
      setMessages((prev) => [...prev, { q: "Soru", a: fallback }]);
    }
  };

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  return (
    <div className="assistant-wrapper position-fixed bottom-0 end-0 m-4 z-1050">
      {open ? (
        <div
          className="assistant-box card shadow-lg border-0 rounded-4 overflow-hidden"
          style={{ width: "350px", maxHeight: "80vh" }}
        >
          <div className="assistant-header bg-primary text-white d-flex justify-content-between align-items-center px-3 py-2">
            <span className="fw-bold">🤖 Akıllı Asistan</span>
            <button
              onClick={() => setOpen(false)}
              className="btn-close btn-close-white"
            ></button>
          </div>

          {/* Kategori Butonları */}
          <div className="px-3 py-2">
            <div className="d-flex flex-wrap gap-2">
              <button onClick={() => handleCategoryClick("cart")} className="btn btn-outline-secondary btn-sm">🛒 Sepetim</button>
              <button onClick={() => handleCategoryClick("iade-kargo")} className="btn btn-outline-secondary btn-sm">🧾 İade</button>
              <button onClick={() => handleCategoryClick("Iletisim")} className="btn btn-outline-secondary btn-sm">📞 İletişim</button>
              <button onClick={() => handleCategoryClick("iade-kargo")} className="btn btn-outline-secondary btn-sm">🚚 Kargo</button>
              <button onClick={() => handleCategoryClick("siparis-islemleri")} className="btn btn-outline-secondary btn-sm">🛍️ Siparişlerim</button>
            </div>
          </div>

          <div
            className="assistant-body px-3 py-2 overflow-auto"
            style={{ height: "300px" }}
            ref={chatRef}
          >
            {messages.map((msg, i) => (
              <div key={i} className="mb-3">
                <div className="d-flex justify-content-end">
                  <div className="bg-primary text-white p-2 px-3 rounded-start-4 rounded-top-4">
                    {msg.q}
                  </div>
                </div>
                <div className="d-flex justify-content-start mt-1">
                  <div className="bg-light text-dark p-2 px-3 rounded-end-4 rounded-top-4 border">
                    {msg.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="assistant-input p-3 border-top">
            <select
              className="form-select mb-2"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
            </select>

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={query}
                placeholder={language === "tr" ? "Sorunuzu yazın..." : "Type your question..."}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              />
              <button className="btn btn-primary" onClick={handleAsk}>
                {language === "tr" ? "Sor" : "Ask"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="assistant-toggle btn btn-primary rounded-circle shadow-lg p-3"
          onClick={() => setOpen(true)}
          title="Akıllı Asistanı Aç"
        >
          <i className="fa fa-comment-dots fa-lg"></i>
        </button>
      )}
    </div>
  );
}

export default SmartAssistant;
