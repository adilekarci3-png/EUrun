import React, { useCallback, useState, useEffect } from "react";
import Button from "devextreme-react/button";
import DataGrid, {
  Column,
  Paging,
  Lookup,
} from "devextreme-react/data-grid";
import Popup from "devextreme-react/popup";
import axios from "axios";
import Swal from "sweetalert2";
import ProductCreate from "./ProductCreate";

const MINIO_ENDPOINT = "http://46.31.79.7:9000";
const PUBLIC_BUCKET = "media-public";
const API_BASE = "http://localhost:8000";

const buildPublicImageUrl = (img) => {
  if (!img || typeof img !== "string") return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/")) return `${API_BASE}${img}`; // /media/... gibi
  return `${MINIO_ENDPOINT}/${PUBLIC_BUCKET}/${img}`; // objectKey varsayımı
};

function ProductList2() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [events, setEvents] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

 
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8000/api/categories/").then((res) => {
      const categoryData = res.data.map((item) => ({
        id: item.id,
        category: item.name,
      }));
      setCategories(categoryData);
    });

    axios.get("http://localhost:8000/api/brands/").then((res) => {
      const brandData = res.data.map((item) => ({
        id: item.id,
        brand: item.name,
      }));
      setBrands(brandData);
    });

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/products/");
      setProducts(res.data);
      console.log("Ürün verisi:", res.data);
    } catch (err) {
      console.error("Ürün verisi çekilemedi:", err);
    }
  };

  const handleDeleteClick = async (rowData) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ürünü silmek istediğinizden emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:8000/api/products/delete/${rowData.id}/`
        );
        Swal.fire("Başarılı", "Ürün başarıyla silindi", "success");
      } catch (error) {
        Swal.fire("Hata", "Ürün silinemedi", "error");
      }
    }
  };

  const handleEditClick = (rowData) => {
    console.log(rowData);
    setSelectedData(rowData);
    setPopupVisible(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Button
        text="Yeni Ürün Ekle (Popup)"
        type="success"
        stylingMode="contained"
        onClick={() => setPopupVisible(true)}
        style={{ marginBottom: "10px" }}
      />
      <Popup
        title="Yeni Ürün Ekle"
        visible={popupVisible}
        onHiding={() => setPopupVisible(false)}
        dragEnabled={true}
        showCloseButton={true}
        width={600}
        height={600}
      >
        <ProductCreate
          initialData={selectedData}
          onSuccess={() => {
            fetchProducts();
            setPopupVisible(false);
          }}
        />
      </Popup>

      {/* Grid */}
      <DataGrid
        id="gridContainer"
        dataSource={products}
        keyExpr="id"
        allowColumnReordering={true}
        showBorders={true}
      >
        <Paging enabled={true} />

        <Column dataField="name" caption="İsim" />
        <Column
          dataField="image"
          caption="Resim"
          cellRender={({ data }) => {
            const src = buildPublicImageUrl(data.image);
            return (
              <img
                src={src}
                alt="Ürün görseli"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            );
          }}
          width={80}
        />
        <Column dataField="price" caption="Fiyat" />
        <Column dataField="count_in_stock" width={130} caption="Stok" />
        <Column dataField="category" caption="Kategori" width={125}>
          <Lookup
            dataSource={categories}
            displayExpr="category"
            valueExpr="id"
          />
        </Column>
        <Column dataField="brand" caption="Marka" width={125}>
          <Lookup dataSource={brands} displayExpr="brand" valueExpr="id" />
        </Column>
        <Column dataField="rating" width={125} />
        <Column dataField="description" width={125} />
        <Column dataField="num_reviews" width={125} />

        {/* <Column
          type="buttons"
          width={120}
          buttons={["edit", "delete", "save", "cancel"]}
        /> */}
        <Column
          caption="İşlem"
          width={120}
          cellRender={({ data }) => (
            <div
              style={{ display: "flex", justifyContent: "center", gap: "6px" }}
            >
              <img
                src="resources/images/edit-button.png"
                alt="Düzenle"
                title="Düzenle"
                width="24"
                height="24"
                style={{ cursor: "pointer" }}
                onClick={() => handleEditClick(data)}
              />
              <img
                src="resources/images/trash.png"
                alt="Sil"
                title="Sil"
                width="24"
                height="24"
                style={{ cursor: "pointer" }}
                onClick={() => handleDeleteClick(data)}
              />
            </div>
          )}
        />
      </DataGrid>

      <div id="events" style={{ marginTop: "20px" }}>
        <div>
          <div className="caption">Yaptığın Eylemler</div>
          <Button id="clear" text="Clear" onClick={clearEvents} />
        </div>
        <ul>
          {events.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProductList2;
