import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Header from "../componets/Header";
import Footer from "../componets/Footer";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function MainLayout({ context }) {
  useEffect(() => {
    const removeDxLicense = () => {
      const el = document.querySelector("dx-license");
      if (el) el.remove();
    };
    removeDxLicense();
    const observer = new MutationObserver(removeDxLicense);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Container className="mt-4 mb-5" style={{ maxWidth: "1200px" }}>
        <Header />
        <Row>
          <Col md={2} className="mt-4">
            <Sidebar />
          </Col>
          <Col
            md={10}
            className="d-flex justify-content-start align-items-start mt-4"
            style={{ minHeight: "80vh" }}
          >
            <Outlet context={context} />            
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default MainLayout;
