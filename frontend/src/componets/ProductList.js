import React,{useState,useEffect} from "react";
import DataGrid, {
  Column,
  MasterDetail,
  Selection,
} from "devextreme-react/data-grid";
import axios from "axios";

const onContentReady = (e) => {
  if (!e.component.getSelectedRowKeys().length) {
    e.component.selectRowsByIndexes([0]);
  }
};

const onSelectionChanged = (e) => {
  e.component.collapseAll(-1);
  e.component.expandRow(e.currentSelectedRowKeys[0]);
};

const renderDetail = (props) => {
  const { image, description } = props.data;
  return (
    <div className="employee-info">
      <img
        className="employee-photo"
        alt="Employee photo"
        src={`http://localhost:8000${image}`}
      />
      <p className="employee-notes">{description}</p>
    </div>
  );
};

function ProductList() {
  const [products, setProducts] = useState([])
   useEffect(() => {
    axios
      .get('http://localhost:8000/api/products/')
      .then((res) => {
        console.log(res.data);
        setProducts(res.data);
        console.log(`http://localhost:8000${res.data[0].image}`);
      })
      .catch((err) => {
        console.error('Ürün verisi çekilemedi:', err)
      })
  }, [])

  return (
    <div>
      <DataGrid
        id="grid-container"
        dataSource={products}
        keyExpr="id"
        onSelectionChanged={onSelectionChanged}
        onContentReady={onContentReady}
        showBorders={true}
      >
        <Selection mode="single" />
        <Column dataField="name" width={70} caption="Title" />
        <Column dataField="brand" />
        <Column dataField="category" />
        <Column dataField="price" width={170} />
        <Column dataField="count_in_stock" width={125} />
        <Column dataField="rating" />
        <Column dataField="num_reviews" />        
        <MasterDetail enabled={false} render={renderDetail} />
      </DataGrid>
    </div>
  );
}

export default ProductList;
