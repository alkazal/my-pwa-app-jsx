import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import { subscribeUserToPush } from "./lib/pushClient";

//window.subscribeUserToPush = subscribeUserToPush;   
// import { registerSW } from 'virtual:pwa-register';
// registerSW({ immediate: true })

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(() => {
      console.log("SW registered");
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

