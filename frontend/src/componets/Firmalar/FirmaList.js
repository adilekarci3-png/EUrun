import React, { useEffect, useState } from 'react';
import DataGrid, {
  Column,
  Paging,
  Pager,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  ColumnChooser,
} from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import api from "../../redux/authSlice";
import FirmaCreatePage from './FirmaCreatePage';
import { FaEdit, FaTrash } from 'react-icons/fa';

const FirmaList = () => {
  // const api = useAxios();
  const [data, setData] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [editingFirma, setEditingFirma] = useState(null);

  const fetchData = () => {
    api.get('firmalar/')
      .then((res) => 
        {
          debugger;
        setData(res.data);
        console.log(res.data);
      })
      .catch((err) => console.error('Veri alınamadı:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreatePopup = () => {
    setEditingFirma({
      full_name: '',
      email: '',
      phone: '',
      address_data: {
        street: '',
        city: '',
        country: '',
        postal_code: '',
      },
    });
    setPopupVisible(true);
  };

  const openEditPopup = (firma) => {
    setEditingFirma(firma);
    setPopupVisible(true);
  };

  const handleDelete = async (firma) => {
    const confirmDelete = window.confirm(`\"${firma.full_name}\" adlı firmayı silmek istiyor musunuz?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`firmalar/${firma.id}/`);
      fetchData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Firma Listesi</h2>

      <div className="mb-2">
        <Button text="➕ Firma Ekle" type="success" onClick={openCreatePopup} />
      </div>

      <DataGrid
        dataSource={data}
        showBorders={true}
        keyExpr="id"
        columnAutoWidth={true}
        allowColumnResizing={true}
        rowAlternationEnabled={true}
      >
        <SearchPanel visible={true} highlightCaseSensitive={true} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <ColumnChooser enabled={true} mode="dragAndDrop" />

        <Paging defaultPageSize={10} />
        <Pager showPageSizeSelector={true} showInfo={true} />

        <Column dataField="full_name" caption="Firma Adı" allowFiltering={true}/>
        <Column dataField="email" caption="Email" />
        <Column dataField="phone" caption="Telefon" />
        
        <Column
          caption="İşlemler"
          width={120}
          alignment="center"
          cellRender={({ data }) => (
            <div className="d-flex justify-content-center gap-2">
              <Button
                stylingMode="text"
                hint="Düzenle"
                render={() => <FaEdit />}
                onClick={() => openEditPopup(data)}
              />
              <Button
                stylingMode="text"
                hint="Sil"
                type="danger"
                render={() => <FaTrash />}
                onClick={() => handleDelete(data)}
              />
            </div>
          )}
        />
      </DataGrid>

      <Popup
        visible={popupVisible}
        onHiding={() => setPopupVisible(false)}
        dragEnabled        
        showTitle
        title={editingFirma?.id ? "Firma Düzenle" : "Yeni Firma Ekle"}
        width={800}
        height="auto"
        contentRender={() => (
          <div className="p-3">
            {editingFirma && (
              <FirmaCreatePage
                firmaData={editingFirma}
                onClose={() => setPopupVisible(false)}
                onSuccess={fetchData}
              />
            )}
          </div>
        )}
      />
    </div>
  );
};

export default FirmaList;


