import { useState, useEffect, useRef } from "react";
import api from "../../api";
import NewActivityForm from "../forms/NewActivityForm";
import {
  startHour,
  endHour,
  intervalMinutes,
  days,
  getDateFromSelection,
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

export default function WeekView({ usuariosSeleccionados }) {
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
  const [startDragXY, setStartDragXY] = useState({ x: 0, y: 0 });
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

  const handleMouseDown = (rowIndex, colIndex) => {
    setIsDragging(true);
    setStartCell({ rowIndex, colIndex });
    setSelectedCells([{ rowIndex, colIndex }]);
  };

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (isDragging && startCell && colIndex === startCell.colIndex) {
      const minRow = Math.min(startCell.rowIndex, rowIndex);
      const maxRow = Math.max(startCell.rowIndex, rowIndex);
      const newSelection = [];
      for (let i = minRow; i <= maxRow; i++) {
        newSelection.push({ rowIndex: i, colIndex });
      }
      setSelectedCells(newSelection);
    }
  };

  const handleMouseUp = (endRowIndex, endColIndex) => {
    if (isDragging && startCell && endColIndex === startCell.colIndex) {
      const minRow = Math.min(startCell.rowIndex, endRowIndex);
      const maxRow = Math.max(startCell.rowIndex, endRowIndex);
      const col = startCell.colIndex;

      // ✅ Posicionamos el formulario en el td correspondiente
      const td = calendarRef.current.querySelector(
        `tbody tr:nth-child(${minRow + 1}) td:nth-child(${col + 2})`
      );
      const rect = td?.getBoundingClientRect();
      if (rect) {
        setFormPosition({ x: rect.left, y: rect.top });
      }

      setSelection({ day: days[col], start: minRow, end: maxRow });
      setFormVisible(true);
      setActividadEditando(null);
    }
    setIsDragging(false);
    setStartCell(null);
  };

  const isCellSelected = (rowIndex, colIndex) =>
    selectedCells.some((c) => c.rowIndex === rowIndex && c.colIndex === colIndex);

  const calcularPosiciones = (actividades) => {
    const franjas = {};
    actividades.forEach((act) => {
      const inicio = new Date(act.fecha_inicio);
      const fin = new Date(act.fecha_fin);
      const col = (inicio.getDay() + 6) % 7;
      const startRow = Math.floor(
        ((inicio.getHours() - startHour) * 60 + inicio.getMinutes()) / intervalMinutes
      );
      const endRow = Math.ceil(
        ((fin.getHours() - startHour) * 60 + fin.getMinutes()) / intervalMinutes
      );
      for (let r = startRow; r < endRow; r++) {
        const clave = `${col}-${r}`;
        if (!franjas[clave]) franjas[clave] = [];
        franjas[clave].push(act);
      }
    });

    return actividades.map((act) => {
      const inicio = new Date(act.fecha_inicio);
      const fin = new Date(act.fecha_fin);
      const col = (inicio.getDay() + 6) % 7;
      const startRow = Math.floor(
        ((inicio.getHours() - startHour) * 60 + inicio.getMinutes()) / intervalMinutes
      );
      const endRow = Math.ceil(
        ((fin.getHours() - startHour) * 60 + fin.getMinutes()) / intervalMinutes
      );
      let maxSolapes = 1;
      for (let r = startRow; r < endRow; r++) {
        const clave = `${col}-${r}`;
        maxSolapes = Math.max(maxSolapes, (franjas[clave] || []).length);
      }
      maxSolapes = Math.min(maxSolapes, 6);
      const claveInicio = `${col}-${startRow}`;
      const ordenadas = [...(franjas[claveInicio] || [])].sort(
        (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
      );
      const index = ordenadas.findIndex((a) => a.id === act.id);
      return {
        ...act,
        posicion: { col, total: maxSolapes, index: Math.max(index, 0), startRow, endRow },
      };
    });
  };

  const handleDragStart = (e, actividad, modo) => {
    e.stopPropagation();
    if (modo === "mover") setDraggedId(actividad.id);
    else if (modo === "resize") setResizeId(actividad.id);
    setStartDragXY({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!draggedId && !resizeId) return;
    const now = Date.now();
    if (now - lastMoveTime.current < 80) return;
    lastMoveTime.current = now;

    const deltaX = e.clientX - startDragXY.x;
    const deltaY = e.clientY - startDragXY.y;
    const stepY = Math.floor(deltaY / 20);
    const stepX = Math.round(deltaX / 160);

    if (stepY === 0 && stepX === 0) return;
    setStartDragXY((prev) => ({
      x: prev.x + stepX * 160,
      y: prev.y + stepY * 20,
    }));

    setActividades((prev) =>
      prev.map((a) => {
        if (a.id === draggedId || a.id === resizeId) {
          let nuevaInicio = new Date(a.fecha_inicio);
          let nuevaFin = new Date(a.fecha_fin);
          if (a.id === draggedId) {
            nuevaInicio.setMinutes(nuevaInicio.getMinutes() + stepY * intervalMinutes);
            nuevaFin.setMinutes(nuevaFin.getMinutes() + stepY * intervalMinutes);
            nuevaInicio.setDate(nuevaInicio.getDate() + stepX);
            nuevaFin.setDate(nuevaFin.getDate() + stepX);
          } else if (a.id === resizeId) {
            nuevaFin.setMinutes(nuevaFin.getMinutes() + stepY * intervalMinutes);
            if ((nuevaFin - nuevaInicio) / 60000 < intervalMinutes) return a;
          }
          const actualizada = {
            ...a,
            fecha_inicio: nuevaInicio.toISOString(),
            fecha_fin: nuevaFin.toISOString(),
          };
          api
            .put(`/actividades/${a.id}/`, actualizada, {
              headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
            })
            .catch(console.error);
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

  const actividadesConPosicion = calcularPosiciones(
    actividades.filter(
      (a) =>
        !usuariosSeleccionados.length ||
        usuariosSeleccionados.includes(a.usuario_responsable?.id)
    )
  );

  return (
    <div className="flex-1 overflow-auto relative select-none" ref={calendarRef}>
      <table className="w-full border-collapse table-fixed">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="w-[80px]" />
            {days.map((day, idx) => (
              <th
                key={idx}
                className="text-xs font-semibold text-center border-l w-[calc((100%-80px)/7)]"
              >
                <div>{day}</div>
                <div className="text-[10px] text-gray-400">
                  {
                    new Date(
                      new Date().setDate(new Date().getDate() - new Date().getDay() + idx + 1)
                    ).getDate()
                  }
                </div>
              </th>
            ))}
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
                <td className="text-xs pr-2 text-right w-[80px] text-gray-500 align-top">
                  {timeLabel}
                </td>
                {days.map((_, j) => (
                  <td
                    key={j}
                    className={`border-l cursor-pointer ${
                      isCellSelected(i, j) ? "bg-black" : "hover:bg-blue-50"
                    }`}
                    onMouseDown={() => handleMouseDown(i, j)}
                    onMouseEnter={() => handleMouseEnter(i, j)}
                    onMouseUp={() => handleMouseUp(i, j)}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Contenedor absoluto ahora no bloquea clics en las celdas */}
      <div
        className="absolute top-0"
        style={{
          left: "80px",
          width: "calc(100% - 80px)",
          height: "100%",
          pointerEvents: "none", // ✅ deja pasar eventos a la tabla
        }}
      >
        {actividadesConPosicion.map((actividad) => {
          const { startRow, endRow, index, total, col } = actividad.posicion;
          const topPercent = (startRow / totalRows) * 100;
          const heightPercent = ((endRow - startRow) / totalRows) * 100;
          const widthPercent = 100 / (7 * Math.min(total, 6));
          const leftPercent = col * (100 / 7) + index * widthPercent;
          const claseColor = tipoColores[actividad.tipo] || "bg-black text-white";

          const inicio = new Date(actividad.fecha_inicio);
          const fin = new Date(actividad.fecha_fin);
          const horaInicio = `${inicio.getHours().toString().padStart(2, "0")}:${inicio
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          const horaFin = `${fin.getHours().toString().padStart(2, "0")}:${fin
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          const clienteNombre = actividad.cliente
            ? `${actividad.cliente.nombre} ${actividad.cliente.apellidos || ""}`.trim()
            : "";

          return (
            <div
              key={actividad.id}
              onMouseDown={(e) => handleDragStart(e, actividad, "mover")}
              onClick={(e) => {
                e.stopPropagation();
                setActividadEditando(actividad);
                setFormPosition({ x: e.clientX, y: e.clientY });
                setFormVisible(true);
              }}
              className={`absolute text-xs rounded cursor-pointer ${claseColor} transition-all duration-150 ease-in-out`}
              style={{
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                height: `calc(${heightPercent}% - 4px)`,
                width: `calc(${widthPercent}% - 4px)`,
                padding: "4px",
                userSelect: "none",
                margin: "2px",
                boxSizing: "border-box",
                pointerEvents: "auto", // ✅ los eventos sí funcionan en las actividades
              }}
            >
              <div className="text-[10px]">{`${horaInicio} - ${horaFin}`}</div>
              <div className="font-bold">{actividad.tipo}</div>
              {clienteNombre && <div className="text-[11px]">Con: {clienteNombre}</div>}
              <div className="text-[11px] italic">{actividad.descripcion_empleado}</div>
              <div
                onMouseDown={(e) => handleDragStart(e, actividad, "resize")}
                className="absolute bottom-0 left-1/3 w-1/3 h-2 bg-white/50 cursor-s-resize rounded-sm"
              />
            </div>
          );
        })}
      </div>

      {formVisible && (
        <div className="absolute z-50" style={{ top: formPosition.y, left: formPosition.x }}>
          <NewActivityForm
            actividad={actividadEditando}
            onCancel={() => {
              setFormVisible(false);
              setSelectedCells([]);
              setActividadEditando(null);
            }}
            fechaInicial={selection ? getDateFromSelection(selection).fecha : null}
            horaInicioInicial={selection ? getDateFromSelection(selection).horaInicio : null}
            horaFinInicial={selection ? getDateFromSelection(selection).horaFin : null}
          />
        </div>
      )}
    </div>
  );
}
