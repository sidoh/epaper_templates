import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";

export function ArrayFieldTemplate(props) {
  const { title, items, onAddClick } = props;

  return (
    <Container className="border-left border-secondary pl-2">
      {title && (
        <Row>
          <Col>
            <h4>{title}</h4>
          </Col>
        </Row>
      )}
      {items.map(x => (
        <Row key={x.key} className="bg-secondary my-2 p-2 rounded ml-2">
          <Col className="p-0">
            <div>{x.children}</div>
            <Button
              variant="link"
              className="d-block ml-auto text-danger"
              onClick={x.onDropIndexClick(x.index)}
              size="sm"
            >
              <MemoizedFontAwesomeIcon icon={faTrash} className="fa-fw mr-2" />
              Delete
            </Button>
          </Col>
        </Row>
      ))}

      <Row>
        <Col>
          <Button
            variant="link"
            onClick={onAddClick}
            size="sm"
            className="text-success mt-2"
          >
            <MemoizedFontAwesomeIcon icon={faPlus} className="fa-fw mr-2" />
            Add
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
