import { createRoot } from "react-dom/client";
import { AccessibilityMenu } from "@/components/ui/accessibility-menu";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary level="page" showDetails>
    <App />
    <AccessibilityMenu />
  </ErrorBoundary>
);
