// MinioUploadAdapter.js
export default class MinioUploadAdapter {
  constructor(loader, { getPresigned, onProgress }) {
    this.loader = loader;               // CKEditor file loader
    this.getPresigned = getPresigned;   // presigned POST bilgisini alacak fn
    this.onProgress = onProgress;       // progress callback (opsiyonel)
    this.xhr = null;
    this.abortController = null;
  }

  // CKEditor bu metodu çağırır
  async upload() {
    const file = await this.loader.file;
    if (!file) return Promise.reject("Dosya yok");

    // 1) Presigned POST’u backend’ten al
    const presigned = await this.getPresigned({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      // (ops) maxSize, folder, room, user vs. gönderebilirsin
    });

    // presigned => { url, fields, final_url } bekliyoruz
    if (!presigned?.url || !presigned?.fields) {
      return Promise.reject("Presigned POST alınamadı");
    }

    // 2) FormData hazırla
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file); // presigned POST zorunlu alan adı "file"

    // 3) XHR ile yükle
    this.abortController = new AbortController();
    this.xhr = new XMLHttpRequest();
    const xhr = this.xhr;

    return new Promise((resolve, reject) => {
      xhr.open("POST", presigned.url, true);

      // Progress
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          this.loader.uploadTotal = evt.total;
          this.loader.uploaded = evt.loaded;
          this.onProgress?.(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // CKEditor, { default: "https://..." } bekler
          // MinIO S3 uyumlu; presigned POST dönüşü body dönmez.
          // URL’i backend’ten aldığımız `final_url` üzerinden veriyoruz.
          resolve({ default: presigned.final_url });
        } else {
          reject(`Yükleme hatası: ${xhr.status} ${xhr.responseText}`);
        }
      };

      xhr.onerror = () => reject("Ağ hatası");
      xhr.onabort = () => reject("Yükleme iptal edildi");

      xhr.send(formData);
    });
  }

  // Kullanıcı iptal ederse
  abort() {
    try {
      this.xhr?.abort();
      this.abortController?.abort();
    } catch (_) {}
  }
}
