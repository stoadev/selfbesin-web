import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./styles/globals.css";
import { AuthProvider } from "./context/AuthContext";
import { MealProvider } from "./context/MealContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MealProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MealProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
