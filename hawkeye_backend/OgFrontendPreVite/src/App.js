import "./index.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ClientList from "./components/lists/ClientList";
import NewClientForm from "./components/forms/NewClientForm";
import ClientDetail from "./components/detail/ClientDetail";
import PropertiesList from "./components/lists/PropertyList";
import PropertyDetail from "./components/detail/PropertyDetail";
import ClientPropEngine from "./components/ClientPropEngine";
import ActivitiesList from "./components/ActivitiesList";
import Informes from "./components/Informes";
import Marketing from "./components/Marketing";
import Questionaries from "./components/Questionaries";
import CreateInstanceSelector from "./components/CreateInstanceSelector";
import Calendar from "./components/calendar/Calendar";
import UserPanel from "./components/UserPanel";
import NewEdificioForm from "./components/forms/NewEdificioForm";
import NewInmuebleForm from "./components/forms/NewInmuebleForm";
import PedidoList from "./components/lists/PedidoList";
import PedidoDetail from "./components/detail/PedidoDetail";
import LoginPage from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";
import SessionExpiredModal from "./components/SessionExpiredModal";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  // ⬇️ Control explícito de opacidad por ruta (fade-in en cada navegación)
  const [routeVisible, setRouteVisible] = useState(false);
  useEffect(() => {
    // Al cambiar de ruta, empezamos ocultos…
    setRouteVisible(false);
    // …y en el siguiente tick activamos la opacidad para que transicione
    const t = setTimeout(() => setRouteVisible(true), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      id="app-container"
      className={`fade-slide flex h-screen flex-col bg-white dark:bg-neutral-900
                  ${routeVisible ? "show" : ""}`}
    >
      {!hideLayout && <Navbar toggleSidebar={toggleSidebar} />}

      <div className="flex flex-1">
        {!hideLayout && <Sidebar isVisible={sidebarVisible} />}

        <div
          className={`flex-1 transition-all duration-300 ${
            hideLayout
              ? "p-0 flex items-center justify-center"
              : `p-6 overflow-auto ${sidebarVisible ? "ml-[10%]" : ""}`
          }`}
        >
          <Routes>
            {/* Público: login redirige a /usuario si ya está autenticado */}
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <LoginPage />
                </RedirectIfAuthenticated>
              }
            />

            {/* Privadas */}
            <Route path="/clientes" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
            <Route path="/clientes/nuevo" element={<ProtectedRoute><NewClientForm /></ProtectedRoute>} />
            <Route path="/clientes/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
            <Route path="/inmuebles" element={<ProtectedRoute><PropertiesList /></ProtectedRoute>} />
            <Route path="/inmuebles/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
            <Route path="/solicitudes" element={<ProtectedRoute><PedidoList /></ProtectedRoute>} />
            <Route path="/solicitudes/:id" element={<ProtectedRoute><PedidoDetail /></ProtectedRoute>} />
            <Route path="/motor-cruce" element={<ProtectedRoute><ClientPropEngine /></ProtectedRoute>} />
            <Route path="/actividades" element={<ProtectedRoute><ActivitiesList /></ProtectedRoute>} />
            <Route path="/informes" element={<ProtectedRoute><Informes /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/cuestionarios" element={<ProtectedRoute><Questionaries /></ProtectedRoute>} />
            <Route path="/crear" element={<ProtectedRoute><CreateInstanceSelector /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/usuario" element={<ProtectedRoute><UserPanel /></ProtectedRoute>} />
            <Route path="/edificios/nuevo" element={<ProtectedRoute><NewEdificioForm /></ProtectedRoute>} />
            <Route path="/inmuebles/nuevo" element={<ProtectedRoute><NewInmuebleForm /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>

      <SessionExpiredModal />
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
