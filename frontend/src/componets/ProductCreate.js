// src/components/ProductCreate.jsx
import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { addNotification } from "../redux/notificationsSlice";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";

/* =============================
   Ortam sabitleri
============================= */
const API_BASE = "http://localhost:8000";        // Django
const MINIO_ENDPOINT = "http://46.31.79.7:9000"; // MinIO
const PUBLIC_BUCKET = "media-public";

/* =============================
   Yardımcılar
============================= */
const isAbsolute = (s) =>
  typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"));
const isLocalPath = (s) => typeof s === "string" && s.startsWith("/");
const looksLikeObjectKey = (s) =>
  typeof s === "string" && !isAbsolute(s) && !isLocalPath(s) && s.includes("/");

/* =============================
   Önizleme Bileşeni (eslint-safe)
============================= */
function ImagePreview() {
  const { values } = useFormikContext();
  const [previewUrl, setPreviewUrl] = React.useState("");

  React.useEffect(() => {
    let cleanup;
    const val = values.image;

    if (val instanceof File) {
      const url = URL.createObjectURL(val);
      console.log("Preview URL (File):", url);
      setPreviewUrl(url);
      cleanup = () => URL.revokeObjectURL(url);
    } else if (typeof val === "string" && val) {
      if (isAbsolute(val)) setPreviewUrl(val);
      else if (isLocalPath(val)) setPreviewUrl(`${API_BASE}${val}`);
      else if (looksLikeObjectKey(val)) setPreviewUrl(`${MINIO_ENDPOINT}/${PUBLIC_BUCKET}/${val}`);
      else setPreviewUrl("");
    } else {
      setPreviewUrl("");
    }

    return cleanup;
  }, [values.image]);

  return previewUrl ? (
    <img
      src={previewUrl}
      alt="Önizleme"
      style={{ maxWidth: "320px", borderRadius: 6, display: "block" }}
    />
  ) : (
    <small style={{ color: "#666" }}>Önizleme yok</small>
  );
}

/* =============================
   Ana Bileşen
============================= */
export default function ProductCreate({ initialData = {}, onSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [categories, setCategories] = React.useState([]);
  const [brands, setBrands] = React.useState([]);

  // kategori/marka yükle
  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          axios.get(`${API_BASE}/api/categories/`),
          axios.get(`${API_BASE}/api/brands/`),
        ]);
        if (!alive) return;
        setCategories(cRes.data || []);
        setBrands(bRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    run();
    return () => (alive = false);
  }, []);

  // initial values (enableReinitialize destekli)
  const initialValues = React.useMemo(
    () => ({
      id: initialData?.id ?? 0,
      name: initialData?.name || "",
      price: initialData?.price ?? 0,
      count_in_stock: initialData?.count_in_stock ?? 0,
      category: initialData?.category ?? "",
      brand: initialData?.brand ?? "",
      description: initialData?.description || "",
      rating: initialData?.rating ?? 0,
      num_reviews: initialData?.num_reviews ?? 0,
      image: initialData?.image || null, // string (url/objectKey) veya File
    }),
    [initialData]
  );

  // Yup şeması
  const MAX_IMAGE_MB = 5;
  const MAX_DESC = 2000;
  const ValidationSchema = Yup.object({
    name: Yup.string().trim().min(2, "Ürün adı en az 2 karakter.").required("Zorunlu alan."),
    brand: Yup.mixed().required("Marka seçiniz."),
    category: Yup.mixed().required("Kategori seçiniz."),
    price: Yup.number().typeError("Sayı giriniz.").min(0, "0 veya büyük olmalı.").required("Zorunlu alan."),
    count_in_stock: Yup.number().typeError("Tam sayı giriniz.").integer("Tam sayı olmalı.").min(0, "0 veya büyük olmalı.").required("Zorunlu alan."),
    rating: Yup.number().typeError("Sayı giriniz.").min(0, "0-10 arası").max(10, "0-10 arası").required("Zorunlu alan."),
    num_reviews: Yup.number().typeError("Tam sayı giriniz.").integer("Tam sayı olmalı.").min(0, "0 veya büyük olmalı.").required("Zorunlu alan."),
    description: Yup.string().max(MAX_DESC, `En fazla ${MAX_DESC} karakter.`),
    image: Yup.mixed().test("file-check", "Sadece resim ve ≤ 5MB.", (value) => {
      if (!value) return true; // boş ya da değişmemiş string
      if (typeof value === "string") return true;
      if (value instanceof File) {
        const okType = value.type && value.type.startsWith("image/");
        const okSize = value.size / (1024 * 1024) <= MAX_IMAGE_MB;
        return okType && okSize;
      }
      return false;
    }),
  });

  // submit
  const submitHandler = async (vals, { setSubmitting }) => {
    try {
      // backend integer bekliyorsa (select'lerden string gelebilir) -> dönüştür
      const normalized = {
        ...vals,
        brand: vals.brand ? Number(vals.brand) : "",
        category: vals.category ? Number(vals.category) : "",
      };

      const data = new FormData();
      Object.keys(normalized).forEach((key) => {
        if (key === "image") {
          if (normalized.image instanceof File) data.append("image", normalized.image);
        } else {
          data.append(key, normalized[key]);
        }
      });

      if (normalized.id) {
        await axios.put(`${API_BASE}/api/products/${normalized.id}/update/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Swal.fire({ icon: "success", title: "Başarılı", text: "Ürün güncellendi." });
        dispatch(
          addNotification({
            channel: "header",
            type: "success",
            title: "Ürün güncellendi",
            message: `"${normalized.name}" güncellendi.`,
          })
        );
      } else {
        await axios.post(`${API_BASE}/api/products/create/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Swal.fire({ icon: "success", title: "Başarılı", text: "Yeni ürün eklendi." });
        dispatch(
          addNotification({
            channel: "header",
            type: "success",
            title: "Yeni ürün eklendi",
            message: `"${normalized.name}" başarıyla eklendi.`,
          })
        );
      }

      onSuccess?.();
      // navigate(-1); // istersen geri dön
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Hata", text: "İşlem başarısız." });
      dispatch(
        addNotification({
          channel: "header",
          type: "error",
          title: "İşlem başarısız",
          message: String(err),
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =============================
     Tam sayfa sade UI
  ============================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#f6f7fb",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 18 }}>Ürün Oluştur / Güncelle</h2>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={ValidationSchema}
          onSubmit={submitHandler}
          validateOnBlur
          validateOnChange
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form noValidate>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Sol sütun */}
                <div style={{ display: "grid", gap: 12 }}>
                  <FieldBlock label="Ürün Adı" name="name">
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ürün adı"
                      className="inp"
                    />
                  </FieldBlock>

                  <FieldBlock label="Açıklama" name="description">
                    <Field
                      id="description"
                      name="description"
                      as="textarea"
                      rows="6"
                      className="inp"
                    />
                  </FieldBlock>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldBlock label="Marka" name="brand">
                      <Field id="brand" name="brand" as="select" className="inp">
                        <option value="">Marka Seç</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Field>
                    </FieldBlock>

                    <FieldBlock label="Kategori" name="category">
                      <Field id="category" name="category" as="select" className="inp">
                        <option value="">Kategori Seç</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Field>
                    </FieldBlock>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldBlock label="Fiyat" name="price">
                      <Field id="price" name="price" type="number" min="0" step="0.01" className="inp" />
                    </FieldBlock>

                    <FieldBlock label="Stok" name="count_in_stock">
                      <Field id="count_in_stock" name="count_in_stock" type="number" min="0" step="1" className="inp" />
                    </FieldBlock>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldBlock label="Rating (0-10)" name="rating">
                      <Field id="rating" name="rating" type="number" min="0" max="10" step="0.1" className="inp" />
                    </FieldBlock>

                    <FieldBlock label="Beğeni" name="num_reviews">
                      <Field id="num_reviews" name="num_reviews" type="number" min="0" step="1" className="inp" />
                    </FieldBlock>
                  </div>
                </div>

                {/* Sağ sütun: Görsel */}
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ fontWeight: 600 }}>Ürün Görseli</label>
                  <ImagePreview />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFieldValue("image", e.currentTarget.files?.[0] || null)}
                    style={{ display: "block" }}
                  />
                  <ErrorLine name="image" />
                  <small style={{ color: "#666" }}>
                    Yeni dosya seçersen anında yerel önizleme gösterilir.
                  </small>
                </div>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={primaryBtnStyle(isSubmitting)}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={ghostBtnStyle}
                >
                  Geri
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Basit stiller */}
      <style>{`
        .inp {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          background: #fff;
        }
        .inp:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .lbl {
          display: inline-block;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .err {
          color: #d33;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

/* =============================
   Küçük yardımcı UI bileşenleri
============================= */

function FieldBlock({ label, name, children }) {
  return (
    <div>
      <label htmlFor={name} className="lbl">{label}</label>
      {children}
      <ErrorLine name={name} />
    </div>
  );
}

function ErrorLine({ name }) {
  return (
    <div className="err">
      <ErrorMessage name={name} />
    </div>
  );
}

/* =============================
   Buton stilleri
============================= */
function primaryBtnStyle(disabled) {
  return {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #2563eb",
    background: disabled ? "#93c5fd" : "#2563eb",
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
  };
}
const ghostBtnStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 600,
};
