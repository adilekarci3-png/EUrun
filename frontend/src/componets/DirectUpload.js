// src/components/DirectUpload.js
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { api, selectIsLoggedIn } from "../redux/authSlice";

export default function DirectUpload() {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [expiresSec] = useState(7200); // 2 saat (setter'ı kullanmıyoruz)

  // Liste için
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const PRIVATE_BUCKET = "media-private";

  // === Yardımcılar ===
  const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

  function validatePdf(f) {
    if (!f) return "Dosya seçilmedi";
    const mimeOk = f.type === "application/pdf";
    const extOk = /\.pdf$/i.test(f.name);
    if (!mimeOk && !extOk) return "Yalnızca PDF dosyası yükleyebilirsiniz";
    if (f.size > MAX_SIZE) return `PDF boyutu max ${MAX_SIZE / 1024 / 1024} MB olabilir`;
    return null;
  }

  function fmtSize(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  // === Listeleme (useCallback ile stabilize) ===
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(
        "/upload/list/",
        { prefix: "docs/", maxKeys: 100 },
        { headers: { "Content-Type": "application/json" } }
      );
      setItems(res.data.items || []);
      setStatus("Liste güncellendi ✅");
    } catch (e) {
      console.error(e);
      setStatus("Listeleme hatası: " + (e.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  }, []);

  // === PDF Yükleme ===
  async function handleUpload() {
    if (!file) return;
    const err = validatePdf(file);
    if (err) {
      setStatus("❌ " + err);
      return;
    }
    if (!isLoggedIn) {
      setStatus("❌ Giriş gerekli");
      return;
    }

    setStatus("URL alınıyor...");

    try {
      const meta = {
        keyPrefix: "docs/",
        filename: file.name,
        contentType: "application/pdf",
      };

      // 1) presigned POST al
      const res = await api.post("/upload/presigned-post/", meta, {
        headers: { "Content-Type": "application/json" },
      });
      const data = res.data;

      if (!data?.url || !data?.fields /* || !data?.objectKey */) {
        setStatus("Hata: presigned alanları gelmedi");
        return;
      }

      // 2) MinIO'ya yükle
      const form = new FormData();
      Object.entries(data.fields).forEach(([k, v]) => form.append(k, v));
      form.append("file", file);

      setStatus("Yükleniyor...");
      const up = await fetch(data.url, { method: "POST", body: form });
      if (!up.ok) {
        const t = await up.text();
        setStatus(`Hata (upload): ${up.status} ${t}`);
        return;
      }

      setStatus("Yükleme tamam ✅, liste yenileniyor...");
      await loadList(); // Listeyi güncelle
    } catch (err) {
      console.error(err);
      setStatus("Hata: " + (err.message || "Bilinmeyen hata"));
    }
  }

  // Açmak için presigned GET
  async function openItem(key) {
    try {
      setStatus("Link hazırlanıyor...");
      const res = await api.post(
        "/upload/presigned-download/",
        {
          objectKey: key,
          bucket: PRIVATE_BUCKET,
          expiresSec, // 2 saat
          downloadName: key.split("/").pop(),
          contentType: "application/pdf",
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const { url } = res.data;
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("Link hazır ✅");
    } catch (e) {
      setStatus("Hata (indirme): " + (e.message || "Bilinmeyen hata"));
    }
  }

  // Mount'ta listele
  useEffect(() => {
    loadList();
  }, [loadList]);

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h3>📄 PDF Yükleme (media-private) + Liste</h3>

      {!isLoggedIn && (
        <div style={{ color: "red", marginBottom: 8 }}>
          Bu işlemi yapmak için giriş yapmalısınız.
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={!isLoggedIn}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || !isLoggedIn}
        style={{ marginBottom: 12 }}
      >
        PDF Yükle
      </button>

      <div style={{ marginBottom: 12, color: "#555" }}>{status}</div>

      <h4>📑 Yüklenen PDF'ler</h4>
      {loading && <div>Yükleniyor...</div>}
      {!loading && items.length === 0 && <div>Henüz PDF yok.</div>}

      {items.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 8,
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 6 }}>Dosya</th>
              <th style={{ textAlign: "right", padding: 6 }}>Boyut</th>
              <th style={{ textAlign: "left", padding: 6 }}>Son Değişiklik</th>
              <th style={{ padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.key}>
                <td style={{ padding: 6 }}>
                  <code>{it.key}</code>
                </td>
                <td style={{ padding: 6, textAlign: "right" }}>
                  {fmtSize(it.size)}
                </td>
                <td style={{ padding: 6 }}>
                  {it.lastModified
                    ? new Date(it.lastModified).toLocaleString()
                    : "-"}
                </td>
                <td style={{ padding: 6, textAlign: "center" }}>
                  <button onClick={() => openItem(it.key)}>Aç</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
