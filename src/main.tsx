import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
// Nunito para la marca Kahvi (peso 800, subset latino) â€” ligero.
import "@fontsource/nunito/latin-800.css";
import "@/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontró el elemento #root en index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);




