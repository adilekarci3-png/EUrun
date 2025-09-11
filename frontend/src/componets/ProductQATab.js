import React from "react";
import { ListGroup, Form, Button } from "react-bootstrap";

const ProductQATab = ({
  questions,
  questionText,
  onQuestionTextChange,
  onSubmitQuestion,
}) => {
  return (
    <>
      <ListGroup variant="flush">
        {questions.length === 0 ? (
          <ListGroup.Item>Henüz soru yok.</ListGroup.Item>
        ) : (
          questions.map((qa, idx) => (
            <ListGroup.Item key={idx}>
              <strong>{qa.user}</strong>: {qa.question}
              {qa.answer && (
                <div className="text-muted mt-1">Cevap: {qa.answer}</div>
              )}
            </ListGroup.Item>
          ))
        )}
      </ListGroup>

      <Form className="mt-4">
        <h5>Soru Sor</h5>
        <Form.Group className="mb-2" controlId="questionText">
          <Form.Control
            as="textarea"
            placeholder="Sorunuzu yazın..."
            value={questionText}
            onChange={(e) => onQuestionTextChange(e.target.value)}
          />
        </Form.Group>
        <Button variant="outline-primary" onClick={onSubmitQuestion}>
          Soruyu Gönder
        </Button>
      </Form>
    </>
  );
};

export default ProductQATab;
