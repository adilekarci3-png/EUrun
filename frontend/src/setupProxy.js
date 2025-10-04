const { createProxyMiddleware } = require("http-proxy-middleware");

const TARGET = "http://46.31.79.7:8001";

module.exports = function (app) {
  const wsOpts = {
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: false,
    xfwd: true,
    logLevel: "debug",
    onProxyReqWs(proxyReq) {
      // Origin kontrolüne takılmamak için hedef origin’i gönder
      try { proxyReq.setHeader("origin", TARGET); } catch {}
    },
    onError(err) {
      console.error("[HPM] WS proxy error:", err);
    }
  };

  // SADECE gerçek WS endpoint’inizi proxy’leyin:
  app.use("/ws/chat", createProxyMiddleware(wsOpts));

  // !!! BUNLARI KOYMAYIN !!!
  // app.use("/ws", createProxyMiddleware(wsOpts));       // HMR ile çakışır
  // app.use("/ws-test", createProxyMiddleware(wsOpts));  // Yoksa 404/close
};
