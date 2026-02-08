import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { pwaService } from "./services/pwaService";

// Register PWA service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    pwaService.registerServiceWorker();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
