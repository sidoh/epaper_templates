import { hot } from "react-hot-loader";
import React, { useEffect } from "react";
import Container from "react-bootstrap/Container";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import "./App.scss";
import NavBar from "./NavBar";
import SettingsForm from "./settings/SettingsForm";
import TemplatesIndex from "./templates/TemplatesIndex";
import VariablesIndex from "./variables/VariablesIndex";
import Dashboard from "./dashboard/Dashboard";
import BitmapsIndex from "./bitmaps/BitmapsIndex";
import useGlobalState from "./state/global_state";
import ErrorBoundary from "./util/ErrorBoundary";
import { Alert } from "react-bootstrap";

const App = () => {
  const [globalState, globalActions] = useGlobalState();

  useEffect(() => {
    globalActions.loadInitialState();
  }, []);

  return (
    <div className="container">
      <Router basename="/app">
        <NavBar />

        <Container className="main-content">
          <ErrorBoundary>
            {globalState.errors.map((msg, i) => {
              return (
                <Alert
                  variant="danger"
                  onClose={() => globalActions.dismissError(i)}
                  dismissible
                >
                  {msg}
                </Alert>
              );
            })}
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
          </ErrorBoundary>
        </Container>
      </Router>
    </div>
  );
};

export default hot(module)(App);
