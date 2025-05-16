import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserHistory } from "history";
import { Router } from "wouter";

// Use the browser history
const history = createBrowserHistory();
function useLocation() {
  const [location, setLocation] = useState(history.location.pathname);
  useEffect(() => {
    return history.listen(({ location }) => {
      setLocation(location.pathname);
    });
  }, []);
  return [location, (to: string) => history.push(to)];
}

// Import React hooks
import { useState, useEffect } from "react";

createRoot(document.getElementById("root")!).render(
  <Router hook={useLocation}>
    <App />
  </Router>
);
