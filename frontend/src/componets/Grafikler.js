import React,{useState,useEffect} from "react";
import { Chart, Series } from "devextreme-react/chart";
import axios from "axios";

function Grafikler() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/products/")
      .then((res) => {   

        const grafikVeri = res.data.map((item)=>({
            category : item.category_name,
            stok:item.count_in_stock
        }));
        console.log(grafikVeri);
        setProducts(grafikVeri);        
      })
      .catch((err) => {
        console.error("Ürün verisi çekilemedi:", err);
      });
  }, []);

  return (
    <div>
      <Chart id="chart" dataSource={products}>
        <Series
          valueField="stok"
          argumentField="category"
          name="My oranges"
          type="bar"
          color="#ffaa66"
        />
      </Chart>
    </div>
  );
}

export default Grafikler;
