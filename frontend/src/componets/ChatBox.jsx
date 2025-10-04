// src/components/ChatBox.jsx
// Full-page chat with CKEditor 5 + MinIO upload (presigned POST) + WebSocket (ws-test ile uyumlu)
import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { api, selectUser } from "../redux/authSlice";
import { useSelector } from "react-redux";

/* =========================
   CKEditor Upload Adapter
========================= */
class MinioUploadAdapter {
  constructor(loader, { getPresigned }) {
    this.loader = loader;
    this.getPresigned = getPresigned;
    this._abortController = null;
  }

  async upload() {
    const file = await this.loader.file;
    if (!file) throw new Error("Dosya yok");
    if (!file.type?.startsWith("image/")) throw new Error("Sadece görüntü dosyaları yüklenebilir");

    const presign = await this.getPresigned({ filename: file.name, contentType: file.type });
    const { url, fields, final_url } = presign;

    const form = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => form.append(k, v));
    // fields içinde Content-Type varsa EKLEME! (policy çakışır)
    if (!fields || !("Content-Type" in fields)) form.append("Content-Type", file.type);
    form.append("file", file, file.name);

    this._abortController = new AbortController();
    const res = await fetch(url, { method: "POST", body: form, signal: this._abortController.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`MinIO upload failed: ${res.status} ${txt}`);
    }
    if (!final_url) throw new Error("final_url gelmedi");
    return { default: final_url };
  }

  abort() { try { this._abortController?.abort(); } catch {} }
}

function MinioUploadPlugin(editor) {
  const opts = editor.config.get("minioUpload") || {};
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
    new MinioUploadAdapter(loader, { getPresigned: opts.getPresigned });
}

/* =========================
   Helpers
========================= */
const sanitize = (html) => DOMPurify.sanitize(html || "");
const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* =========================
   Component
========================= */
export default function ChatBox() {
  const defaultRoom = process.env.REACT_APP_CHAT_ROOM || "general";
  const fallbackUser = process.env.REACT_APP_CHAT_USER || "Deneme";

  const userObj = useSelector(selectUser);
  const usernameFromRedux = useMemo(() => {
    if (!userObj) return fallbackUser;
    return (
      userObj.username ||
      userObj.name ||
      userObj.full_name ||
      (userObj.email ? String(userObj.email).split("@")[0] : null) ||
      (userObj.id ? `user-${userObj.id}` : fallbackUser)
    );
  }, [userObj, fallbackUser]);

  const [room, setRoom] = useState(defaultRoom);
  const [user, setUser] = useState(usernameFromRedux);
  useEffect(() => { setUser(usernameFromRedux); }, [usernameFromRedux]);

  const [messages, setMessages] = useState([]);
  const [html, setHtml] = useState("");
  const [wsState, setWsState] = useState("idle");

  const scrollerRef = useRef(null);
  const wsRef = useRef(null);

  // WS URL: TEMPLATE varsa onu kullan
  const makeWsUrl = (targetRoom) => {
  const template = (process.env.REACT_APP_WS_TEMPLATE || "").trim();
  if (template) {
    const replaced = template.includes("{room}")
      ? template.replace("{room}", encodeURIComponent(targetRoom))
      : template;

    // Sayfa https ise ws://’yi wss:// yap
    if (window.location.protocol === "https:" && replaced.startsWith("ws://")) {
      return replaced.replace(/^ws:\/\//, "wss://");
    }
    return replaced;
  }

  // (İsterseniz fallback, ama karışıklık olmasın diye template ile yetinmek daha temiz)
  const isHttps = window.location.protocol === "https:";
  const proto = isHttps ? "wss" : "ws";
  const host = process.env.REACT_APP_WS_HOST || window.location.host;
  return `${proto}://${host}/ws/chat/${encodeURIComponent(targetRoom)}/`;
};

  // Hangi modda mesaj yollayacağız?
  // - ws-test -> çoğu kez PLAIN TEXT bekler
  // - /ws/chat/... -> JSON bekliyor
  const wsMode = useMemo(() => {
    const t = (process.env.REACT_APP_WS_TEMPLATE || "").toLowerCase();
    const override = (process.env.REACT_APP_WS_SEND_MODE || "").toLowerCase(); // text | json | both
    if (override === "text" || override === "json" || override === "both") return override;
    if (t.includes("/ws-test")) return "both"; // güvenli: hem text hem JSON gönder
    return "json";
  }, []);

  // Scroll to bottom
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // WS bağlan
  useEffect(() => {
    let retry = 0;
    let manualClose = false;

    const connect = () => {
      setWsState("connecting");
      const url = makeWsUrl(room);
      console.log("WS connect ->", url, "| mode:", wsMode);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setWsState("open");
        console.log("✅ WS open");
        // test ping (ws-test için görsel teyit)
        try { ws.send("/* hello from ChatBox */"); } catch {}
      };

      ws.onmessage = (e) => {
        // ham mesajı da logla
        // console.log("WS message raw:", e.data);
        try {
          const data = JSON.parse(e.data);
          setMessages((p) => [...p, data]);
        } catch {
          setMessages((p) => [...p, { user: "server", message: String(e.data) }]);
        }
      };

      ws.onerror = (err) => { console.error("WS error", err); setWsState("error"); };

      ws.onclose = (e) => {
        console.warn("WS closed", { code: e.code, reason: e.reason, wasClean: e.wasClean });
        setWsState("closed");
        if (!manualClose) {
          const delay = Math.min(1000 * 2 ** retry, 10000);
          retry++; setTimeout(connect, delay);
        }
      };
    };

    connect();
    return () => { manualClose = true; try { wsRef.current?.close(); } catch {} };
  }, [room, wsMode]); // wsMode değişirse de yeniden bağlan

  const sendMsg = () => {
    const contentHtml = (html || "").trim();
    if (!contentHtml) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not open, state:", ws?.readyState);
      return;
    }

    // Gönderilecekler
    const asText = stripHtml(contentHtml);
    const asJson = JSON.stringify({ user, message: contentHtml });

    try {
      if (wsMode === "text") {
        ws.send(asText);
      } else if (wsMode === "json") {
        ws.send(asJson);
      } else {
        // both: ws-test’i de, chat endpoint’ini de memnun eder :)
        ws.send(asText);
        ws.send(asJson);
      }
      setHtml("");
    } catch (e) {
      console.error("WS send error:", e);
    }
  };

  /* ---------------- Presign çağrıları (DirectUpload ile birebir) ---------------- */
  const getDownloadUrl = async ({ objectKey, bucket, filename, contentType }) => {
    const { data } = await api.post(
      "/upload/presigned-download/",
      { objectKey, bucket, downloadName: filename, contentType },
      { headers: { "Content-Type": "application/json" } }
    );
    return data.url;
  };

  const getPresigned = async ({ filename, contentType }) => {
    const meta = { keyPrefix: `chat/${room}/`, filename, contentType };
    const { data } = await api.post("/upload/presigned-post/", meta, {
      headers: { "Content-Type": "application/json" },
    });
    let finalUrl = data.publicUrl || null;
    if (!finalUrl && data.objectKey) {
      try {
        finalUrl = await getDownloadUrl({
          objectKey: data.objectKey,
          bucket: data.bucket,
          filename,
          contentType,
        });
      } catch (_) {}
    }
    return { url: data.url, fields: data.fields, final_url: finalUrl };
  };

  const [tmpRoom, setTmpRoom] = useState(room);
  const [tmpUser, setTmpUser] = useState(user);
  useEffect(() => { setTmpUser(user); }, [user]);

  const applyHeader = (e) => {
    e?.preventDefault?.();
    if (tmpRoom && tmpRoom !== room) setRoom(tmpRoom);
    if (tmpUser && tmpUser !== user) setUser(tmpUser);
  };

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr auto", background: "#f5f7fb" }}>
      {/* Üst Şerit */}
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #e7ebf0", background: "#ffffff", display: "flex", alignItems: "center", gap: 12 }}>
        <strong>Chat •</strong>
        <form onSubmit={applyHeader} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Room</label>
          <input value={tmpRoom} onChange={(e) => setTmpRoom(e.target.value)} style={{ padding: 6, border: "1px solid #d0d7de", borderRadius: 6 }} />
          <label style={{ fontSize: 12, opacity: 0.7 }}>User</label>
          <input value={tmpUser} onChange={(e) => setTmpUser(e.target.value)} style={{ padding: 6, border: "1px solid #d0d7de", borderRadius: 6 }} />
          <button type="submit" style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc" }}>Uygula</button>
        </form>
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
          WS: {wsState} • mode: {wsMode}
        </span>
      </header>

      {/* Mesajlar */}
      <main ref={scrollerRef} style={{ padding: 16, overflowY: "auto" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          {messages.length === 0 && <div style={{ opacity: 0.6, fontSize: 14 }}>Henüz mesaj yok. İlk mesajı yazın…</div>}
          {messages.map((m, i) => {
            const mine = m.user === user;
            return (
              <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", margin: "8px 0" }}>
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12, color: "#475569", textAlign: mine ? "right" : "left" }}>{m.user || "server"}</div>
                  <div
                    style={{ background: mine ? "#e6f0ff" : "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                    dangerouslySetInnerHTML={{ __html: sanitize(m.message) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Editor + Gönder */}
      <footer style={{ borderTop: "1px solid #e7ebf0", background: "#ffffff" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", padding: 12 }}>
          <CKEditor
            editor={ClassicEditor}
            data={html}
            onReady={(editor) => editor.keystrokes.set("Ctrl+Enter", (evt, cancel) => { sendMsg(); cancel(); })}
            onChange={(_, editor) => setHtml(editor.getData())}
            config={{
              licenseKey: "GPL",
              extraPlugins: [MinioUploadPlugin],
              minioUpload: { getPresigned },
              placeholder: "Mesaj yaz… (Ctrl+Enter ile gönder)",
              toolbar: ["undo","redo","|","bold","italic","link","|","imageUpload","|","bulletedList","numberedList","|","blockQuote"],
              image: {
                toolbar: [
                  "toggleImageCaption","imageTextAlternative","|",
                  "imageStyle:inline","imageStyle:block","imageStyle:side"
                ],
              },
              link: {
                decorators: {
                  addTargetToExternalLinks: {
                    mode: "automatic",
                    callback: (url) => /^https?:\/\//.test(url),
                    attributes: { target: "_blank", rel: "noopener" },
                  },
                },
              },
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={sendMsg} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc" }}>Gönder</button>
            <div style={{ opacity: 0.7, alignSelf: "center" }}>
              Görsel eklemek için: sürükle-bırak / kopyala-yapıştır / <code>imageUpload</code>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
