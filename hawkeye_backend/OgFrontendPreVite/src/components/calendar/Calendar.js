import { useEffect, useState, useRef } from "react";
import { CalendarIcon } from "lucide-react";
import WeekView from "./WeekView";
import DayView from "./DayView";
import MonthView from "./MonthView";
import api from "../../api";

const VISTAS = {
  DIA: "DÍA",
  SEMANA: "SEMANA",
  MES: "MES",
};

export default function Calendar() {
  const [vista, setVista] = useState(VISTAS.SEMANA);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const res = await api.get("/usuarios/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsuarios(res.data);
        setUsuariosSeleccionados(res.data.map((u) => u.id));
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  const toggleUsuario = (id) => {
    setUsuariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownAbierto(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const textoResumen =
    usuariosSeleccionados.length === 0
      ? "Sin usuarios"
      : usuariosSeleccionados.length === usuarios.length
      ? "Todos los usuarios"
      : `${usuariosSeleccionados.length} seleccionados`;

  return (
    <div className="flex flex-col h-screen">
      {/* Barra superior */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 relative">
        <div className="flex gap-4 items-center">
          <CalendarIcon className="w-5 h-5" />
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value={VISTAS.DIA}>Vista diaria</option>
            <option value={VISTAS.SEMANA}>Vista semanal</option>
            <option value={VISTAS.MES}>Vista mensual</option>
          </select>
        </div>

        {/* Dropdown con checkboxes */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            {textoResumen}
          </button>
          {dropdownAbierto && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow-md max-h-60 overflow-auto z-50 w-64 p-2 space-y-1">
              {usuarios.map((u) => {
                const label = u.first_name || u.last_name
                  ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                  : u.username;
                return (
                  <label key={u.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={usuariosSeleccionados.includes(u.id)}
                      onChange={() => toggleUsuario(u.id)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vista activa */}
      <div className="flex-1 overflow-auto">
        {vista === VISTAS.DIA && (
          <DayView usuariosSeleccionados={usuariosSeleccionados} />
        )}
        {vista === VISTAS.SEMANA && (
          <WeekView usuariosSeleccionados={usuariosSeleccionados} />
        )}
        {vista === VISTAS.MES && (
          <MonthView usuariosSeleccionados={usuariosSeleccionados} />
        )}
      </div>
    </div>
  );
}
