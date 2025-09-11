import React,{useEffect,useState} from "react";
import PieChart, {
  Series as PieSeries,
  Label as PieLabel,
  Legend as PieLegend,
} from "devextreme-react/pie-chart";
import Chart, {
  ArgumentAxis,
  ValueAxis,
  Series,
  Legend,
  Tooltip,
  Export,
} from "devextreme-react/chart";
import axios from "axios";
import { Col, Container, Row } from "react-bootstrap";

function ProductChartsDx() {
  const [products, setProducts] = useState([])
   useEffect(() => {      
      axios
        .get('http://localhost:8000/api/products/')
        .then((res) => {
          console.log(res.data);
          setProducts(res.data);          
        })
        .catch((err) => {
          console.error('Ürün verisi çekilemedi:', err)
        })
    }, [])
    
  // 1. Kategoriye göre ürün sayısı
  const categoryData = Object.values(
    products.reduce((acc, product) => {
      acc[product.category] = acc[product.category] || {
        category: product.category,
        count: 0,
      };
      acc[product.category].count += 1;
      return acc;
    }, {})
  );

  // 2. Markalara göre ortalama puan
  const brandRatings = Object.values(
    products.reduce((acc, product) => {
      const { brand, rating } = product;
      if (!acc[brand]) acc[brand] = { brand, total: 0, count: 0 };
      acc[brand].total += rating;
      acc[brand].count += 1;
      return acc;
    }, {})
  ).map((b) => ({ brand: b.brand, rating: b.total / b.count }));

  // 3. Ürün stokları
  const stockData = products.map((p) => ({
    name: p.name,
    stock: p.countInStock,
  }));

  // 4. Ürün fiyatları
  const priceData = products.map((p) => ({ name: p.name, price: p.price }));

  return (
    <>
      <Container>
        <Row>
          <Col lg={6}>
            <h5>Kategoriye Göre Ürün Sayısı</h5>
            <PieChart id="categoryChart" dataSource={categoryData}>
              <PieSeries argumentField="category" valueField="count" />
              <PieLabel visible={true} />
              <PieLegend visible={true} />
            </PieChart>
          </Col>

          <Col lg={6}>
            <h5>Markalara Göre Ortalama Puan</h5>
            <Chart dataSource={brandRatings}>
              <ArgumentAxis />
              <ValueAxis />
              <Series
                valueField="rating"
                argumentField="brand"
                type="bar"
                name="Ortalama Puan"
              />
              <Legend visible={false} />
              <Tooltip enabled={true} />
              <Export enabled={false} />
            </Chart>
          </Col>
          <Col lg={6}>
            <h5>Ürünlere Göre Stok Miktarı</h5>
            <Chart dataSource={stockData}>
              <ArgumentAxis />
              <ValueAxis />
              <Series
                valueField="stock"
                argumentField="name"
                type="line"
                name="Stok"
              />
              <Legend visible={false} />
              <Tooltip enabled={true} />
            </Chart>
          </Col>

          <Col lg={6}>
            <h5>Ürün Fiyat Dağılımı</h5>
            <Chart dataSource={priceData}>
              <ArgumentAxis />
              <ValueAxis />
              <Series
                valueField="price"
                argumentField="name"
                type="area"
                name="Fiyat"
              />
              <Legend visible={false} />
              <Tooltip enabled={true} />
            </Chart>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ProductChartsDx;
