import React, { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";

function RegisterForm() {
  const [formData, setForm] = useState({
    ad: "",
    soyad: "",
    email: "",
    sifre: "",
  });

  const handleChange = (e) => {
    setForm({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveToFile = () => {
    const content = `
Ad: ${formData.ad}
Soyad: ${formData.soyad}
E-Posta: ${formData.email}
Şifre: ${formData.sifre}
-----------------------------
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = "kullanici_kaydi.txt";
    link.href = url;
    link.click();
  };
  return (
    <>
      <Container className="mt-4">
        <Form>
          <Form.Group className="mb-3" controlId="formBasicAd">
            <Form.Label>İsim</Form.Label>
            <Form.Control
              type="text"
              placeholder="Adınızı Giriniz"
              name="ad"
              onChange={handleChange}
            />
            <Form.Text className="text-muted"></Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicSoyad">
            <Form.Label>Soyisim</Form.Label>
            <Form.Control
              type="text"
              placeholder="Soy Adınızı Giriniz"
              name="soyad"
              onChange={handleChange}
            />
            <Form.Text className="text-muted"></Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email Giriniz"
              name="email"
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              E-mail adresinizi kimse ile paylaşmayacağız
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Şifre</Form.Label>
            <Form.Control
              type="password"
              placeholder="Şifre Giriniz"
              name="sifre"
              onChange={handleChange}
            />
          </Form.Group>
          {/* <Form.Group className="mb-3" controlId="formBasicCheckbox">
            <Form.Check type="checkbox" label="Check me out" />
          </Form.Group> */}
          <Button variant="primary" type="submit" onClick={handleSaveToFile}>
            Kayıt Ol
          </Button>
        </Form>
      </Container>
    </>
  );
}

export default RegisterForm;

