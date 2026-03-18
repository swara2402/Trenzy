import { createRoot } from "react-dom/client";
import { GroupProvider } from "./contexts/GroupContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <GroupProvider>
    <App />
  </GroupProvider>
);
