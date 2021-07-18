import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter, Route, Redirect, Switch } from "react-router-dom";
import Login from "./views/Login.js";
import Stanby from "./views/Stanby.js";
import Field from "./views/Field.js";
import GameOver from "./views/GameOver.js";

ReactDOM.render(
  <BrowserRouter>
    <Switch>
      <Route path="/login" render={props => <Login {...props} />} />
      <Route path="/stanby" render={props => <Stanby {...props} />} />
      <Route path="/field" render={props => <Field {...props} />} />
      <Route path="/gameover" render={props => <GameOver {...props} />} />
      <Redirect to="/login" />
    </Switch>
</BrowserRouter>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
