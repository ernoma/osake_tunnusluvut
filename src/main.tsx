import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.tsx";
import "./styles/tokens.css";

const root = document.getElementById("root");
if (!root) throw new Error("Juurielementtiä #root ei löytynyt");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
