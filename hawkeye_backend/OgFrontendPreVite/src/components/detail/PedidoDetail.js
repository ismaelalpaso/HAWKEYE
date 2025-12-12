import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import api from "../../api";
import NewActivityForm from "../forms/NewActivityForm";
import SaveButton from "../SaveButton";
import SecondaryButton from "../SecondaryButton";

export default function PedidoDetail() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [originalPedido, setOriginalPedido] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [searchActivity, setSearchActivity] = useState("");

  const fetchPedido = async () => {
    try {
      const res = await api.get(`/pedidos/${id}/`);
      setPedido(res.data);
      setOriginalPedido(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la solicitud.");
    }
  };

  const fetchActividades = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.get(`/actividades/pedido/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActividades(res.data);
    } catch (err) {
      console.error("Error cargando actividades:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchPedido();
      await fetchActividades();
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleFieldChange = (field, value) => {
    setPedido((prev) => ({ ...prev, [field]: value }));
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      await api.patch(`/pedidos/${id}/`, editedFields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPedido();
      setEditedFields({});
    } catch (err) {
      console.error("Error guardando:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    setPedido(originalPedido);
    setEditedFields({});
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("es-ES") : "—";

  if (loading) return <div>Cargando...</div>;
  if (error)
    return <div className="text-red-600 bg-red-100 p-4 rounded">{error}</div>;
  if (!pedido) return <div>Datos no disponibles.</div>;

  const filteredActivities = actividades.filter((a) => {
    const q = searchActivity.toLowerCase();
    return (
      a.descripcion_empleado?.toLowerCase().includes(q) ||
      a.estado?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex gap-4 w-full relative">
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <NewActivityForm
            pedidoId={id}
            onCancel={() => setShowForm(false)}
            onCreated={async () => {
              setShowForm(false);
              await fetchActividades();
            }}
          />
        </Modal>
      )}

      {/* IZQUIERDA */}
      <div className="w-2/3 space-y-4">
        {/* Encabezado */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold text-gray-800">
            Solicitud de {pedido.cliente?.nombre || "Cliente desconocido"}
          </h2>
          <p className="text-gray-500 text-sm">
            Creada el {formatDate(pedido.fecha)} | Última modificación:{" "}
            {formatDate(pedido.fecha_ultima_modificacion)}
          </p>
        </div>

        {/* Datos básicos */}
        <h3 className="text-lg font-semibold">Datos básicos</h3>
        <div className="bg-white border rounded shadow divide-y">
          <EditableSection label="Ubicaciones" value={pedido.ubicaciones} onChange={(v) => handleFieldChange("ubicaciones", v)} />
          <EditableSection label="Precio mínimo (€)" value={pedido.precio_min} onChange={(v) => handleFieldChange("precio_min", v)} />
          <EditableSection label="Precio máximo (€)" value={pedido.precio_max} onChange={(v) => handleFieldChange("precio_max", v)} />
          <EditableSection label="Superficie mínima (m²)" value={pedido.superficie_min} onChange={(v) => handleFieldChange("superficie_min", v)} />
          <EditableSection label="Superficie máxima (m²)" value={pedido.superficie_max} onChange={(v) => handleFieldChange("superficie_max", v)} />
          <EditableSection label="Habitaciones" value={pedido.habitaciones} onChange={(v) => handleFieldChange("habitaciones", v)} />
          <EditableSection label="Baños" value={pedido.banos} onChange={(v) => handleFieldChange("banos", v)} />
          <EditableSection label="Balcón" value={pedido.balcon ? "Sí" : "No"} onChange={(v) => handleFieldChange("balcon", v === "Sí")} />
          <EditableSection label="Jardín" value={pedido.jardin ? "Sí" : "No"} onChange={(v) => handleFieldChange("jardin", v === "Sí")} />
        </div>

        {/* Datos financieros */}
        <h3 className="text-lg font-semibold mt-3">Datos financieros</h3>
        <div className="bg-white border rounded shadow divide-y">
          <EditableSection
            label="Información de financiación"
            value={pedido.info_financiacion || "—"}
            onChange={(v) => handleFieldChange("info_financiacion", v)}
          />
        </div>

        {/* Footer de guardado */}
        {Object.keys(editedFields).length > 0 && (
          <div className="flex justify-end gap-3 mt-4 bg-gray-50 p-3 rounded shadow">
            <button
              onClick={handleCancelar}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className={`px-3 py-1.5 rounded text-white ${
                saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {/* DERECHA */}
      <div className="w-1/3 space-y-4">
        {/* Actividades relacionadas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Actividades recientes</h3>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Nueva
            </button>
          </div>
          {actividades.length === 0 ? (
            <p className="text-sm text-gray-600">No hay actividades.</p>
          ) : (
            actividades.slice(0, 2).map((a) => (
              <ActividadCard key={a.id} actividad={a} />
            ))
          )}
          {actividades.length > 2 && (
            <button
              onClick={() => setShowAllActivities(true)}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Ver más
            </button>
          )}
        </div>

        {/* Cliente */}
        {pedido.cliente && (
          <div className="bg-white rounded shadow p-3">
            <h3 className="text-lg font-semibold mb-2">Cliente asociado</h3>
            <Link
              to={`/clientes/${pedido.cliente.id}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {pedido.cliente.nombre} {pedido.cliente.apellido1 || ""}{" "}
              {pedido.cliente.apellido2 || ""}
            </Link>
            <p className="text-sm text-gray-600 mt-1">
              {pedido.cliente.telefono_movil || pedido.cliente.telefono || "Sin teléfono"}
            </p>
            <p className="text-sm text-gray-600">
              {pedido.cliente.email || "Sin email"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* === Subcomponentes reutilizados === */

function EditableSection({ label, value, onChange, children }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  useEffect(() => setTempValue(value), [value]);

  return (
    <div className="p-1.5 relative group">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {editing ? (
        children ? (
          children
        ) : (
          <input
            type="text"
            className="w-full border rounded px-1 py-1 text-sm"
            value={tempValue === "—" ? "" : tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => {
              onChange(tempValue);
              setEditing(false);
            }}
            autoFocus
          />
        )
      ) : (
        <p className="text-sm">{value}</p>
      )}
      <button
        onClick={() => setEditing(true)}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
      >
        <Pencil size={14} className="text-blue-500" />
      </button>
    </div>
  );
}

function ActividadCard({ actividad }) {
  return (
    <div className="bg-white shadow p-2.5 rounded border border-gray-200 hover:border-blue-500 space-y-1.5">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-700">{actividad.tipo || "—"}</p>
        <p className="text-xs text-gray-500">
          {actividad.fecha_inicio
            ? new Date(actividad.fecha_inicio).toLocaleDateString("es-ES")
            : "—"}
        </p>
      </div>
      <p className="text-sm text-gray-600">
        {actividad.descripcion_empleado || "Sin descripción"}
      </p>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-4 w-[40rem] max-w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-sm"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
