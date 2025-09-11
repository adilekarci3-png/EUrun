import DataGrid from "devextreme-react/data-grid";
import { Container } from "react-bootstrap";

const columns = ["name"];

function KategoriListe({ kategoriler }) {
   
  return (
    <Container className="mt-5">
        <h5>Kategori Listesi</h5>
      <DataGrid
        dataSource={kategoriler}
        key="id"
        defaultColumns={columns}
        showBorders={true}
      />
    </Container>
  );
}

export default KategoriListe;
