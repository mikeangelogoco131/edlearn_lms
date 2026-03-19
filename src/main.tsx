
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { applyInitialThemeFromStorage } from "./app/contexts/ThemeContext";
  import "./styles/index.css";

  applyInitialThemeFromStorage();
  createRoot(document.getElementById("root")!).render(<App />);
  