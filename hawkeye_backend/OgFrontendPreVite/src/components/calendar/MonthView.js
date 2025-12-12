import { useEffect, useState } from "react";
import NewActivityForm from "../forms/NewActivityForm";
import api from "../../api";
import {
  startHour,
  endHour,
  intervalMinutes
} from "./CalendarUtils";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MonthView({ usuariosSeleccionados }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [fechaActual, setFechaActual] = useState(new Date());

  const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

  const primerDiaSemana = primerDiaMes.getDay() === 0 ? 6 : primerDiaMes.getDay() - 1;
  const totalDias = ultimoDiaMes.getDate();

  useEffect(() => {
    const fetchActividades = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const res = await api.get("/actividades/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActividades(res.data);
      } catch (err) {
        console.error("Error obteniendo actividades:", err);
      }
    };
    fetchActividades();
  }, [formVisible]);

  const diasDelMes = [];
  for (let i = 0; i < primerDiaSemana; i++) diasDelMes.push(null);
  for (let i = 1; i <= totalDias; i++) diasDelMes.push(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), i));

  const actividadesDelDia = (fecha) => {
    return actividades.filter((a) => {
      const inicio = new Date(a.fecha_inicio);
      return (
        inicio.toDateString() === fecha.toDateString() &&
        (usuariosSeleccionados.length === 0 || usuariosSeleccionados.includes(a.usuario_responsable?.id))
      );
    });
  };

  const handleClickDia = (fecha, event) => {
    const { clientX, clientY } = event;
    setFormPosition({ x: clientX, y: clientY });
    setSelectedDate(fecha);
    setActividadEditando(null);
    setFormVisible(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-2 py-1 bg-gray-200 rounded"
          onClick={() => {
            const anterior = new Date(fechaActual);
            anterior.setMonth(fechaActual.getMonth() - 1);
            setFechaActual(anterior);
          }}
        >
          ← Mes anterior
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {fechaActual.toLocaleString("es-ES", { month: "long" })} {fechaActual.getFullYear()}
        </h2>
        <button
          className="px-2 py-1 bg-gray-200 rounded"
          onClick={() => {
            const siguiente = new Date(fechaActual);
            siguiente.setMonth(fechaActual.getMonth() + 1);
            setFechaActual(siguiente);
          }}
        >
          Mes siguiente →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center font-semibold border-b pb-1">{d}</div>
        ))}
        {diasDelMes.map((fecha, idx) => (
          <div
            key={idx}
            className={`border p-1 h-28 relative overflow-hidden ${
              fecha ? "cursor-pointer hover:bg-gray-100" : "bg-gray-50"
            }`}
            onClick={(e) => fecha && handleClickDia(fecha, e)}
          >
            {fecha && (
              <>
                <div className="text-xs text-gray-600 absolute top-1 right-1">
                  {fecha.getDate()}
                </div>
                <div className="mt-4 space-y-1 text-[10px] overflow-y-auto max-h-20">
                  {actividadesDelDia(fecha).map((act) => (
                    <div
                      key={act.id}
                      className="bg-black text-white rounded px-1 truncate cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const { clientX, clientY } = e;
                        setActividadEditando(act);
                        setFormPosition({ x: clientX, y: clientY });
                        setSelectedDate(new Date(act.fecha_inicio));
                        setFormVisible(true);
                      }}
                    >
                      {act.descripcion_publica}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {formVisible && (
        <div
          className="absolute z-50"
          style={{ top: formPosition.y, left: formPosition.x }}
        >
          <NewActivityForm
            date={selectedDate}
            onCancel={() => {
              setFormVisible(false);
              setActividadEditando(null);
            }}
            actividad={actividadEditando}
          />
        </div>
      )}
    </div>
  );
}
