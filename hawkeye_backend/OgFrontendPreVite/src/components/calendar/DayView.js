import { useState, useEffect, useRef } from "react";
import api from "../../api";
import NewActivityForm from "../forms/NewActivityForm";
import {
  startHour,
  endHour,
  intervalMinutes,
  getDateFromSelection,
  getStyleForActividad,
} from "./CalendarUtils";

const totalRows = ((endHour - startHour) * 60) / intervalMinutes;

const tipoColores = {
  "Adquisición": "bg-yellow-400 text-black",
  "Visita": "bg-blue-500 text-white",
  "Llamada": "bg-green-500 text-white",
  "Contacto directo": "bg-red-500 text-white",
  "Genérica": "bg-gray-500 text-white",
  "Zona": "bg-orange-500 text-white",
  "Reunión o curso": "bg-purple-600 text-white",
};

export default function DayView({ usuariosSeleccionados }) {
  const [formVisible, setFormVisible] = useState(false);
  const [formPosition, setFormPosition] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [actividadEditando, setActividadEditando] = useState(null);
  const calendarRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [resizeId, setResizeId] = useState(null);
  const [startDragY, setStartDragY] = useState(0);
  const lastMoveTime = useRef(Date.now());

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

  const handleMouseDown = (rowIndex) => {
    setIsDragging(true);
    setStartCell({ rowIndex });
    setSelectedCells([{ rowIndex }]);
  };

  const handleMouseEnter = (rowIndex) => {
    if (isDragging && startCell) {
      const minRow = Math.min(startCell.rowIndex, rowIndex);
      const maxRow = Math.max(startCell.rowIndex, rowIndex);
      const newSelection = [];
      for (let i = minRow; i <= maxRow; i++) {
        newSelection.push({ rowIndex: i });
      }
      setSelectedCells(newSelection);
    }
  };

  const handleMouseUp = (endRowIndex) => {
    if (isDragging && startCell) {
      const minRow = Math.min(startCell.rowIndex, endRowIndex);
      const maxRow = Math.max(startCell.rowIndex, endRowIndex);
      const top = minRow * 20 + 64;
      const left = 160;
      setFormPosition({ x: left, y: top });
      setSelection({ day: "Hoy", start: minRow, end: maxRow });
      setFormVisible(true);
      setActividadEditando(null);
    }
    setIsDragging(false);
    setStartCell(null);
  };

  const isCellSelected = (rowIndex) =>
    selectedCells.some((cell) => cell.rowIndex === rowIndex);

  const datosTiempo = selection ? getDateFromSelection(selection) : null;

  const actividadesHoy = actividades.filter((a) => {
    const inicio = new Date(a.fecha_inicio);
    const hoy = new Date();
    return (
      (!usuariosSeleccionados.length ||
        usuariosSeleccionados.includes(a.usuario_responsable?.id)) &&
      inicio.toDateString() === hoy.toDateString()
    );
  });

  const calcularPosiciones = (actividades) => {
    const franjas = {};
    actividades.forEach((act) => {
      const start = new Date(act.fecha_inicio);
      const end = new Date(act.fecha_fin);
      const startRow =
        Math.floor(((start.getHours() - startHour) * 60 + start.getMinutes()) / intervalMinutes);
      const endRow =
        Math.ceil(((end.getHours() - startHour) * 60 + end.getMinutes()) / intervalMinutes);
      for (let r = startRow; r < endRow; r++) {
        if (!franjas[r]) franjas[r] = [];
        franjas[r].push(act);
      }
    });

    return actividades.map((act) => {
      const start = new Date(act.fecha_inicio);
      const end = new Date(act.fecha_fin);
      const startRow =
        Math.floor(((start.getHours() - startHour) * 60 + start.getMinutes()) / intervalMinutes);
      const endRow =
        Math.ceil(((end.getHours() - startHour) * 60 + end.getMinutes()) / intervalMinutes);
      let maxSolapes = 1;
      for (let r = startRow; r < endRow; r++) {
        const fila = franjas[r] || [];
        maxSolapes = Math.max(maxSolapes, fila.length);
      }
      const filaStart = franjas[startRow] || [];
      const ordenadas = [...filaStart].sort(
        (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      );
      const index = ordenadas.findIndex((a) => a.id === act.id);
      return {
        ...act,
        posicion: {
          total: maxSolapes,
          index: Math.max(index, 0),
        },
      };
    });
  };

  const handleDragStart = (e, actividad, modo) => {
    e.stopPropagation();
    if (modo === "mover") setDraggedId(actividad.id);
    else if (modo === "resize") setResizeId(actividad.id);
    setStartDragY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!draggedId && !resizeId) return;

    const now = Date.now();
    if (now - lastMoveTime.current < 80) return; // delay mínimo de 80ms
    lastMoveTime.current = now;

    const deltaY = e.clientY - startDragY;
    const steps = Math.floor(deltaY / 20); // cada 20px = 15min
    if (steps === 0) return;
    setStartDragY((prev) => prev + steps * 20);

    setActividades((prev) =>
      prev.map((a) => {
        if (a.id === draggedId || a.id === resizeId) {
          const nuevaInicio = new Date(a.fecha_inicio);
          const nuevaFin = new Date(a.fecha_fin);
          if (a.id === draggedId) {
            nuevaInicio.setMinutes(nuevaInicio.getMinutes() + steps * intervalMinutes);
            nuevaFin.setMinutes(nuevaFin.getMinutes() + steps * intervalMinutes);
          }
          if (a.id === resizeId) {
            nuevaFin.setMinutes(nuevaFin.getMinutes() + steps * intervalMinutes);
            if ((nuevaFin - nuevaInicio) / 60000 < intervalMinutes) return a;
          }
          const actualizada = {
            ...a,
            fecha_inicio: nuevaInicio.toISOString(),
            fecha_fin: nuevaFin.toISOString(),
          };
          api.put(`/actividades/${a.id}/`, actualizada, {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          }).catch(console.error);
          return actualizada;
        }
        return a;
      })
    );
  };

  const handleMouseUpGlobal = () => {
    setDraggedId(null);
    setResizeId(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  });

  const actividadesConPosicion = calcularPosiciones(actividadesHoy);

  return (
    <div className="flex-1 overflow-auto relative select-none" ref={calendarRef}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="w-20" />
            <th className="text-xs font-semibold text-center border-l">
              <div>Hoy</div>
              <div className="text-[10px] text-gray-400">{new Date().toLocaleDateString()}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalRows }).map((_, i) => {
            const hour = Math.floor((i * intervalMinutes) / 60) + startHour;
            const minute = (i * intervalMinutes) % 60;
            const timeLabel = `${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}`;
            return (
              <tr key={i} className="h-5 border-b">
                <td className="text-xs pr-2 text-right w-20 text-gray-500 align-top">
                  {timeLabel}
                </td>
                <td
                  className={`border-l cursor-pointer ${
                    isCellSelected(i) ? "bg-black" : "hover:bg-blue-50"
                  }`}
                  onMouseDown={() => handleMouseDown(i)}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseUp={() => handleMouseUp(i)}
                />
              </tr>
            );
          })}
        </tbody>
      </table>


      {actividadesConPosicion.map((actividad) => {
        const inicio = new Date(actividad.fecha_inicio);
        const fin = new Date(actividad.fecha_fin);

        const startRow = Math.floor(((inicio.getHours() - startHour) * 60 + inicio.getMinutes()) / intervalMinutes);
        const endRow = Math.ceil(((fin.getHours() - startHour) * 60 + fin.getMinutes()) / intervalMinutes);

        const top = 64 + startRow * 20 - 10;
        const height = (endRow - startRow) * 20;

        const { total, index } = actividad.posicion;
        const containerWidth = calendarRef.current?.offsetWidth || 800;
        const columnaHora = 160;
        const anchoDisponible = containerWidth - columnaHora;
        const width = anchoDisponible / Math.min(total, 6);
        const leftOffset = columnaHora + index * width;

        const claseColor = tipoColores[actividad.tipo] || "bg-black text-white";

        return (
          <div
            key={actividad.id}
            onMouseDown={(e) => handleDragStart(e, actividad, "mover")}
            onClick={(e) => {
              e.stopPropagation();
              setActividadEditando(actividad);
              setFormPosition({ x: leftOffset, y: top });
              setFormVisible(true);
            }}
            className={`absolute text-xs rounded cursor-pointer ${claseColor} transition-all duration-150 ease-in-out`}
            style={{
              top: top,
              left: leftOffset + 2,
              height: height - 4,
              width: width - 4,
              padding: "4px",
              userSelect: "none",
              margin: "2px",
              boxSizing: "border-box",
            }}
          >
            <div>{actividad.descripcion_publica}</div>
            <div
              onMouseDown={(e) => handleDragStart(e, actividad, "resize")}
              className="absolute bottom-0 left-1/3 w-1/3 h-2 bg-white/50 cursor-s-resize rounded-sm"
              style={{ marginBottom: "2px" }}
            />
          </div>
        );
      })}


      {formVisible && (
        <div className="absolute z-50" style={{ top: formPosition.y, left: formPosition.x }}>
          <NewActivityForm
            actividad={actividadEditando}
            fechaInicial={datosTiempo?.fecha}
            horaInicioInicial={datosTiempo?.horaInicio}
            horaFinInicial={datosTiempo?.horaFin}
            onCancel={() => {
              setFormVisible(false);
              setSelectedCells([]);
              setActividadEditando(null);
            }}
            onCreated={() => {
              setFormVisible(false);
              setSelectedCells([]);
              setActividadEditando(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
