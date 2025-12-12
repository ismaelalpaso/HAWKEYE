import { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import SearchCliente from "../SearchCliente";
import SearchInmueble from "../SearchInmueble";

export default function NewActivityForm({
  clienteId: initialClienteId = null,
  inmuebleId: initialInmuebleId = null,
  actividad = null,
  onCreated = null,
  onCancel = null,
  horaInicioInicial = null,
  horaFinInicial = null,
  fechaInicial = null,
}) {
  const [tipo, setTipo] = useState(actividad?.tipo || "Visita");
  const [estado, setEstado] = useState(actividad?.estado || "En proceso");
  const [descripcion, setDescripcion] = useState(actividad?.descripcion_empleado || "");
  const [descripcionPublica, setDescripcionPublica] = useState(
    actividad?.descripcion_publica || ""
  );
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [horaInicio, setHoraInicio] = useState(horaInicioInicial || "");
  const [horaFin, setHoraFin] = useState(horaFinInicial || "");
  const [fecha, setFecha] = useState(
    fechaInicial ||
      (() =>
        actividad?.fecha_inicio
          ? actividad.fecha_inicio.slice(0, 10)
          : new Date().toISOString().slice(0, 10))
  );
  const [usuarioId, setUsuarioId] = useState(actividad?.usuario_responsable?.id || null);

  // ---- Estados para relación con cliente o inmueble ----
  const [clienteId, setClienteId] = useState(initialClienteId);
  const [inmuebleId, setInmuebleId] = useState(initialInmuebleId);

  const navigate = useNavigate();

  useEffect(() => {
    if (actividad) {
      const inicio = new Date(actividad.fecha_inicio);
      const fin = new Date(actividad.fecha_fin);
      setHoraInicio(inicio.toTimeString().slice(0, 5));
      setHoraFin(fin.toTimeString().slice(0, 5));
      setClienteId(actividad.cliente?.id || null);
      setInmuebleId(actividad.inmueble?.id || null);
    } else if (!horaInicioInicial || !horaFinInicial) {
      const now = new Date();
      now.setSeconds(0, 0);
      const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
      now.setMinutes(roundedMinutes === 60 ? 0 : roundedMinutes);
      if (roundedMinutes === 60) now.setHours(now.getHours() + 1);
      setHoraInicio(now.toTimeString().slice(0, 5));
      const fin = new Date(now.getTime() + 60 * 60000);
      setHoraFin(fin.toTimeString().slice(0, 5));
    }
  }, [actividad, horaInicioInicial, horaFinInicial]);

  const validarHoras = () => horaInicio && horaFin && horaFin > horaInicio;

  const handleEstadoChange = (nuevoEstado) => {
    setEstado(nuevoEstado);
    if (nuevoEstado !== "Realizada") {
      setDescripcionPublica("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validarHoras()) return setError("La hora de fin debe ser mayor que la hora de inicio.");
    if (!usuarioId) return setError("Selecciona un usuario responsable.");

    const fechaInicioISO = new Date(`${fecha}T${horaInicio}:00`).toISOString();
    const fechaFinISO = new Date(`${fecha}T${horaFin}:00`).toISOString();

    const payload = {
      tipo,
      estado,
      descripcion_empleado: descripcion,
      descripcion_publica:
        estado === "Realizada" ? descripcionPublica : "Descripción aún no disponible",
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
      cliente: clienteId || null,
      inmueble: inmuebleId || null,
      usuario_responsable: usuarioId,
    };

    setEnviando(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No estás autenticado.");

      if (actividad?.id) {
        await api.put(`/actividades/${actividad.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post("/actividades/", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (onCreated) onCreated();
      if (onCancel) onCancel();
    } catch (err) {
      console.error("Error en creación/edición de actividad:", err);
      setError(err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-1/2 p-6 rounded-lg shadow-xl space-y-6 relative">
        <h2 className="text-lg font-semibold">
          {actividad ? "Editar Actividad" : "Nueva Actividad"}
        </h2>

        {/* ---- Barra de búsqueda dinámica (ahora con componentes separados) ---- */}
        {!initialClienteId && !initialInmuebleId && (
          <div>
            {["Visita", "Genérica", "Reunión o curso"].includes(tipo) ? (
              <SearchCliente
                onSelect={(r) => {
                  setClienteId(r.id);
                  setInmuebleId(null);
                }}
              />
            ) : (
              <SearchInmueble
                onSelect={(r) => {
                  setInmuebleId(r.id);
                  setClienteId(null);
                }}
              />
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="font-medium text-gray-700">
            {actividad?.cliente?.nombre ||
              actividad?.inmueble?.ref_catastral ||
              "—"}
          </div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="Adquisición">Adquisición</option>
            <option value="Visita">Visita</option>
            <option value="Llamada">Llamada</option>
            <option value="Contacto directo">Contacto directo</option>
            <option value="Genérica">Genérica</option>
            <option value="Zona">Zona</option>
            <option value="Reunión o curso">Reunión o curso</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => e.target.value.length <= 1024 && setDescripcion(e.target.value)}
            rows={4}
            className="w-full mt-1 border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 text-right">
            {1024 - descripcion.length} caracteres restantes
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Descripción pública</label>
          <textarea
            value={descripcionPublica}
            onChange={(e) => estado === "Realizada" && setDescripcionPublica(e.target.value)}
            rows={3}
            disabled={estado !== "Realizada"}
            className={`w-full mt-1 border rounded px-3 py-2 ${
              estado !== "Realizada" ? "bg-gray-100 text-gray-500" : ""
            }`}
            placeholder={
              estado !== "Realizada" ? "Solo disponible si está marcada como realizada" : ""
            }
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="w-1/3">
            <label className="block text-sm font-medium">Hora inicio</label>
            <select
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {generarOpcionesHoras()}
            </select>
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium">Hora fin</label>
            <select
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {generarOpcionesHoras()}
            </select>
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border rounded px-3 py-2"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium">Usuario responsable</label>
            <UserSelector selectedUser={usuarioId} onChange={setUsuarioId} />
          </div>

          <div>
            <label className="block text-sm font-medium">Estado</label>
            <select
              value={estado}
              onChange={(e) => handleEstadoChange(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="Realizada">Realizada</option>
              <option value="En proceso">En proceso</option>
              <option value="No realizada">No realizada</option>
            </select>
          </div>
        </div>

        {error && <pre className="text-red-600 whitespace-pre-wrap break-words">{error}</pre>}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : navigate(-1))}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={enviando}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-white ${
              enviando ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {enviando ? "Guardando..." : actividad ? "Actualizar" : "Crear actividad"}
          </button>
        </div>
      </div>
    </div>
  );
}

function generarOpcionesHoras() {
  const opciones = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      opciones.push(
        <option key={`${hh}:${mm}`} value={`${hh}:${mm}`}>
          {`${hh}:${mm}`}
        </option>
      );
    }
  }
  return opciones;
}

function UserSelector({ selectedUser, onChange }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const res = await fetch("/api/usuarios/", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUsuarios(data);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  return (
    <select
      value={selectedUser || ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border rounded px-3 py-2"
    >
      <option value="">Seleccionar usuario</option>
      {usuarios.map((u) => (
        <option key={u.id} value={u.id}>
          {u.first_name || u.last_name
            ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
            : u.username}
        </option>
      ))}
    </select>
  );
}
