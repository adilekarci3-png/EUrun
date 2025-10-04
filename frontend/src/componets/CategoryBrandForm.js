import { useState } from "react";

export default function DirectUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [objectKey, setObjectKey] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [expiresSec, setExpiresSec] = useState(7200); // 2 saat
  const [expiresAt, setExpiresAt] = useState(null);

  async function handleUpload() {
    if (!file) return;

    setStatus("URL alınıyor...");
    setSignedUrl("");
    setObjectKey("");
    setExpiresAt(null);

    const token = localStorage.getItem("token"); // access token (varsa)

    const meta = {
      keyPrefix: "uploads/",
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    };

    // 1) Django'dan presigned POST iste
    const res = await fetch("http://127.0.0.1:8000/api/upload/presigned-post/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(meta),
    });

    if (!res.ok) {
      const errText = await res.text();
      setStatus(`Hata (step1): ${res.status} ${errText}`);
      return;
    }

    const data = await res.json(); // { url, fields, objectKey, ... }
    if (!data || !data.fields || !data.url || !data.objectKey) {
      setStatus("Hata: presigned alanları gelmedi");
      return;
    }

    // 2) MinIO'ya yükle (presigned POST)
    const form = new FormData();
    Object.entries(data.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);

    setStatus("Yükleniyor...");
    const up = await fetch(data.url, { method: "POST", body: form });
    if (!up.ok) {
      const t = await up.text();
      setStatus(`Hata (step2 upload): ${up.status} ${t}`);
      return;
    }

    // 3) Başarılı yükleme → süreli indirme linki iste
    setStatus("Yükleme tamam. Süreli link oluşturuluyor...");
    setObjectKey(data.objectKey);

    const dlRes = await fetch("http://127.0.0.1:8000/api/upload/presigned-download/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify({
        objectKey: data.objectKey,
        expiresSec,                 // 7200 = 2 saat
        downloadName: file.name,    // tarayıcı indirme adı
        contentType: file.type || "application/octet-stream",
      }),
    });

    if (!dlRes.ok) {
      const err = await dlRes.text();
      setStatus(`Hata (step3 presigned GET): ${dlRes.status} ${err}`);
      return;
    }

    const { url } = await dlRes.json();
    setSignedUrl(url);
    setExpiresAt(new Date(Date.now() + expiresSec * 1000));
    setStatus("Hazır ✅ (link süreli)");
  }

  async function refreshSignedUrl() {
    if (!objectKey) return;
    setStatus("Link yenileniyor...");
    const token = localStorage.getItem("token");
    const dlRes = await fetch("http://127.0.0.1:8000/api/upload/presigned-download/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify({
        objectKey,
        expiresSec,
        downloadName: objectKey.split("/").pop() || "file",
      }),
    });
    if (!dlRes.ok) {
      const err = await dlRes.text();
      setStatus(`Hata (yenile): ${dlRes.status} ${err}`);
      return;
    }
    const { url } = await dlRes.json();
    setSignedUrl(url);
    setExpiresAt(new Date(Date.now() + expiresSec * 1000));
    setStatus("Link yenilendi ✅");
  }

  function copyToClipboard() {
    if (!signedUrl) return;
    navigator.clipboard.writeText(signedUrl);
    setStatus("Kopyalandı 📋");
  }

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h3>MinIO Doğrudan Yükleme + Süreli Link</h3>

      <div style={{ marginBottom: 8 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          Link süresi (saniye):
          <input
            type="number"
            value={expiresSec}
            min={60}
            step={60}
            onChange={(e) => setExpiresSec(parseInt(e.target.value || "0", 10))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
      </div>

      <button onClick={handleUpload} disabled={!file} style={{ marginRight: 8 }}>
        Yükle
      </button>

      {signedUrl && (
        <>
          <button onClick={refreshSignedUrl} style={{ marginRight: 8 }}>
            Linki Yenile
          </button>
          <button onClick={copyToClipboard}>Kopyala</button>
        </>
      )}

      <div style={{ marginTop: 12, color: "#555" }}>{status}</div>

      {signedUrl && (
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Süreli Link:</strong>{" "}
            <a href={signedUrl} target="_blank" rel="noreferrer">
              Aç / İndir
            </a>
          </div>
          {expiresAt && (
            <small>
              Geçerlilik: {expiresAt.toLocaleString()} (yaklaşık {Math.floor(expiresSec/60)} dk)
            </small>
          )}
          <div style={{ marginTop: 6 }}>
            <code style={{ wordBreak: "break-all" }}>{signedUrl}</code>
          </div>
        </div>
      )}

      {objectKey && (
        <div style={{ marginTop: 12 }}>
          <small>
            <strong>ObjectKey:</strong> {objectKey}
          </small>
        </div>
      )}
    </div>
  );
}
