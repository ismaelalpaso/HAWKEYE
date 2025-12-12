// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { Bell, User, BookOpen, Plus } from "lucide-react";


export default function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <nav className="w-full h-16 min-h-16 max-h-16 bg-white border-b shadow-sm flex items-center justify-between px-4 overflow-hidden">
      {/* Izquierda: logo (12.5%) */}
      <div 
        className="basis-[12.5%] flex items-center h-full cursor-pointer"
        onClick={toggleSidebar}
      >
        <span className="text-2xl font-bold text-blue-600">HAWKEYE</span>
      </div>

      {/* Centro: links + barra búsqueda (75%) */}
      <div className="basis-[75%] flex items-center space-x-4 text-sm font-medium text-gray-700 overflow-x-auto h-full">
        <Link to="/clientes" className="hover:text-blue-600 whitespace-nowrap">Clientes</Link>
        <Link to="/inmuebles" className="hover:text-blue-600 whitespace-nowrap">Inmuebles</Link>
        <Link to="/solicitudes" className="hover:text-blue-600 whitespace-nowrap">Solicitudes</Link>
        <Link to="/motor-cruce" className="hover:text-blue-600 whitespace-nowrap">Motor de Cruce</Link>
        <Link to="/actividades" className="hover:text-blue-600 whitespace-nowrap">Actividades/Citas</Link>
        <Link to="/informes" className="hover:text-blue-600 whitespace-nowrap">Búsquedas/Informes</Link>
        <Link to="/marketing" className="hover:text-blue-600 whitespace-nowrap">Marketing</Link>
        <Link to="/cuestionarios" className="hover:text-blue-600 whitespace-nowrap">Cuestionarios</Link>
        <input
          type="text"
          placeholder="Buscar..."
          className="ml-4 px-3 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 w-48 h-8 text-sm"
        />
      </div>

      {/* Derecha: botones (12.5%) */}
      <div className="basis-[12.5%] flex items-center justify-end space-x-4 h-full">
        <button
          className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          title="Crear instancia"
          onClick={() => navigate("/crear")}
        >
          <Plus size={20} />
        </button>

        <button
          className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          title="Manuales"
        >
          <BookOpen size={20} />
        </button>

        <button
          className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          title="Notificaciones"
        >
          <Bell size={20} />
        </button>

        <button
          className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          title="Panel de usuario"
          onClick={() => navigate("/usuario")}
        >
          <User size={20} />
        </button>
      </div>
    </nav>
  );
}
