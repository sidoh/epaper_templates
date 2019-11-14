import { hot } from "react-hot-loader";
import React from "react";
import Container from "react-bootstrap/Container";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import "./App.scss";
import NavBar from "./NavBar";
import SettingsForm from "./settings/SettingsForm";
import TemplatesIndex from "./templates/TemplatesIndex";
import VariablesIndex from "./variables/VariablesIndex";
import Dashboard from "./dashboard/Dashboard";
import BitmapsIndex from "./bitmaps/BitmapsIndex";

const App = () => (
  <div className="container">
    <Router basename="/app">
      <NavBar />

      <Container className="main-content">
        <Switch>
          <Route path="/templates">
            <TemplatesIndex />
          </Route>
          <Route path="/settings">
            <SettingsForm />
          </Route>
          <Route path="/variables">
            <VariablesIndex />
          </Route>
          <Route path="/bitmaps">
            <BitmapsIndex />
          </Route>
          <Route exact path="/">
            <Dashboard />
          </Route>
        </Switch>
      </Container>
    </Router>
  </div>
);

export default hot(module)(App);
