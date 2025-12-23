import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import { subscribeUserToPush } from "./lib/pushClient";

window.subscribeUserToPush = subscribeUserToPush;   
// import { registerSW } from 'virtual:pwa-register';
// registerSW({ immediate: true })

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("/sw.js");
    console.log("SW registered:", reg.scope);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

