import React from 'react';
import Nav from 'react-bootstrap/Nav'
import NavbarBrand from 'react-bootstrap/NavbarBrand'
import Navbar from 'react-bootstrap/Navbar'
import Container from 'react-bootstrap/Container'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  NavLink
} from "react-router-dom";

export default (props) => (
  <Navbar className="navbar-top navbar-expand-lg navbar-dark bg-primary fixed-top">
    <Container>
      <Nav.Item>
        <Link to="/" className="navbar-brand">E-Paper Templates</Link>
      </Nav.Item>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav">
          <Nav.Item>
            <NavLink to="/templates" className="nav-link">Templates</NavLink>
          </Nav.Item>

          <Nav.Item>
            <NavLink to="/settings" className="nav-link">Settings</NavLink>
          </Nav.Item>

          <Nav.Item>
            <NavLink to="/variables" className="nav-link">Variables</NavLink>
          </Nav.Item>

          <Nav.Item>
            <NavLink to="/bitmaps" className="nav-link">Images</NavLink>
          </Nav.Item>
        </ul>
      </div>
    </Container>
  </Navbar>
)