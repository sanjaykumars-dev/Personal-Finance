import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { persistInitialState } from "./store/actions";
import { initSession } from "./store/cloud/session";
import "./index.css";

persistInitialState();
initSession();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
