// src/components/UserPanel.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Login from "./Login";
import { authFetch } from "../api/auth";
import DayView from "./calendar/DayView";
import ActividadCardUser from "./ActividadCardUser";

export default function UserPanel() {
  const { isAuthenticated, user } = useContext(AuthContext);

  const [actividadesPlan, setActividadesPlan] = useState([]);
  const [actividadesRealizadas, setActividadesRealizadas] = useState([]);
  const [objetivos, setObjetivos] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const res = await authFetch("/api/actividades/");
        const data = await res.json();

        const hoy = new Date().toDateString();

        const plan = data.filter(a => {
          const inicio = new Date(a.fecha_inicio);
          return inicio.toDateString() === hoy && a.estado?.toLowerCase() === "planificacion";
        });

        const realizadas = data.filter(a => {
          const inicio = new Date(a.fecha_inicio);
          return inicio.toDateString() === hoy && a.estado?.toLowerCase() === "realizada";
        });

        setActividadesPlan(plan);
        setActividadesRealizadas(realizadas);

        setObjetivos([
          { nombre: "Llamadas", actual: 12, meta: 30 },
          { nombre: "Visitas", actual: 5, meta: 12 },
          { nombre: "Captaciones", actual: 1, meta: 5 },
        ]);
      } catch (e) {
        console.error("Error cargando datos panel:", e);
      }
    };

    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex w-full min-h-[85dvh] max-h-[85dvh] overflow-hidden">

      {/* ░░ COL 1: Actividades plan + Objetivos ░░ */}
      <div className="w-1/3 flex flex-col border-r p-2">

        {/* Actividades planificadas */}
        <div className="h-1/2 overflow-auto p-2 border-b">
          <h3 className="font-semibold text-lg mb-2">Actividades Planificadas Hoy</h3>

          {actividadesPlan.length === 0 ? (
            <p className="text-sm text-gray-500">No hay actividades planificadas.</p>
          ) : (
            <div className="space-y-2 pr-1">
              {actividadesPlan.map(actividad => (
                <ActividadCardUser key={actividad.id} actividad={actividad} />
              ))}
            </div>
          )}
        </div>

        {/* Objetivos del mes */}
        <div className="h-1/2 overflow-y-auto p-2">
          <h3 className="font-semibold text-lg mb-3">Objetivos del Mes</h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 pr-1">
            {objetivos.map((obj, idx) => {
              const progreso = Math.min(obj.actual / obj.meta, 1);

              const size = 120;
              const stroke = 10;
              const radius = 45;
              const circTotal = 2 * Math.PI * radius;
              const arc = (3 / 4) * circTotal;
              const offset = arc * (1 - progreso);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center text-center"
                  style={{ minHeight: "165px" }}
                >
                  <div className="relative" style={{ width: size, height: size * 0.8 }}>
                    <svg width={size} height={size} viewBox="0 0 120 120">
                      <path
                        d="M 30 90 A 45 45 0 1 1 90 90"
                        stroke="#e5e7eb"
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={arc}
                        strokeDashoffset={0}
                      />
                      <path
                        d="M 30 90 A 45 45 0 1 1 90 90"
                        stroke="#10b981"
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={arc}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                      {Math.round(progreso * 100)}%
                    </div>
                  </div>

                  <div className="text-sm font-medium mt-2">{obj.nombre}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {obj.actual} / {obj.meta}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ░░ COL 2: Actividades realizadas (con ActividadCard) ░░ */}
      <div className="w-1/3 p-2 border-r flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Actividades Realizadas Hoy</h3>
          <button
            onClick={() => alert("Abrirá formulario de nueva actividad")}
            className="text-sm text-blue-600 hover:underline"
          >
            + Nueva
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {actividadesRealizadas.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no has realizado actividades hoy.</p>
          ) : (
            actividadesRealizadas.slice(0, 5).map(actividad => (
              <ActividadCardUser key={actividad.id} actividad={actividad} />
            ))
          )}
        </div>

        {actividadesRealizadas.length > 5 && (
          <button
            onClick={() => alert("Mostrar todas las actividades realizadas hoy")}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Ver más
          </button>
        )}
      </div>

      {/* ░░ COL 3: Calendario diario ░░ */}
      <div className="w-1/3 p-2 flex flex-col">
        <h3 className="font-semibold text-lg mb-2">Calendario del Día</h3>
        <div
          className="flex-1 border rounded overflow-y-auto overflow-x-hidden"
          style={{
            maxHeight: "92%",
            scrollBehavior: "smooth",
          }}
        >
          <div
            style={{
              minHeight: "1200px",
              paddingBottom: "20px",
            }}
          >
            <DayView usuariosSeleccionados={[user?.id]} />
          </div>
        </div>
      </div>
    </div>
  );
}

