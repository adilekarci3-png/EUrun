
import DataGrid from "devextreme-react/data-grid";
import { Container } from "react-bootstrap";

const columns = ["name"];

function MarkaListe({ markalar }) {

  return (
    <Container className="mt-5">
      <h5>Marka Listesi</h5>
      <DataGrid
        dataSource={markalar}
        key="id"
        defaultColumns={columns}
        showBorders={true}
      />
    </Container>
  );
}

export default MarkaListe;
