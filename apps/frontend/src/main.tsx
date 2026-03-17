import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "quill/dist/quill.snow.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "sweetalert2/dist/sweetalert2.min.css";
import App from "./App";
import "./styles/_variables.css";
import "./styles/globals.css";

// FO3: Sensible defaults to reduce unnecessary refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
);
