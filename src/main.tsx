import { createRoot } from "react-dom/client";
import { AccessibilityMenu } from "@/components/ui/accessibility-menu";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <AccessibilityMenu />
  </>
);
