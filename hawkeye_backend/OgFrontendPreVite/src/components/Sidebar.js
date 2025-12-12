import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ isVisible }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/usuario");
  };

  return (
    <div
      className={`bg-azul-falcon text-white p-4 fixed top-16 left-0 z-40 transition-transform duration-300 ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      } w-[10%] h-[calc(100vh-4rem)] flex flex-col justify-between`}
    >
      {/* Enlaces principales */}
      <div className="space-y-4">
        <Link
          to="/clientes"
          className="block bg-azul-falcon p-2 rounded hover:bg-naranja-falcon"
        >
          Clientes
        </Link>

        <Link
          to="/clientes/nuevo"
          className="block bg-azul-falcon p-2 rounded hover:bg-naranja-falcon"
        >
          Añadir Cliente
        </Link>

        <Link
          to="/agenda"
          className="block bg-azul-falcon p-2 rounded hover:bg-naranja-falcon hover:text-azul-falcon"
        >
          Agenda
        </Link>
      </div>

      {/* Cerrar sesión */}
      <div className="pt-4 border-t border-white/30">
        <button
          onClick={handleLogout}
          className="w-full text-left bg-red-600 p-2 rounded hover:bg-red-500 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
