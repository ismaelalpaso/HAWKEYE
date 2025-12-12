import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../api";

export default function PropertiesList() {
  const [inmuebles, setInmuebles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEtiquetas, setShowEtiquetas] = useState(false);
  const [columnas, setColumnas] = useState([]);
  const navigate = useNavigate();

  // Campos del modelo + heredados del edificio
  const todasLasColumnas = [
    { key: "direccion", label: "Dirección" },
    { key: "propietario", label: "Propietario" },
    { key: "estado_CRM", label: "Estado CRM" },
    { key: "motivacion", label: "Motivación" },
    { key: "precio_pedido_cliente", label: "Precio pedido (€)" },
    { key: "valoracion", label: "Valoración (€)" },
    { key: "prioridad_noticia", label: "Prioridad" },
    { key: "fecha_ultima_venta_alquiler", label: "Última venta/alquiler" },
    { key: "habitaciones", label: "Habitaciones" },
    { key: "banos", label: "Baños" },
    { key: "estancias", label: "Estancias" },
    { key: "balcon", label: "Balcón" },
    { key: "jardin", label: "Jardín" },
    { key: "anio_construccion", label: "Año construcción" },
    { key: "tipo_finca", label: "Tipo de finca" },
  ];

  useEffect(() => {
    const fetchInmuebles = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await api.get("/inmuebles/");
        setInmuebles(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          setError("Token inválido o expirado. Por favor, inicia sesión.");
        } else {
          setError("Error al cargar inmuebles.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInmuebles();
  }, []);

  // Inicializa las columnas visibles
  useEffect(() => {
    setColumnas(
      todasLasColumnas.map((col) => ({
        ...col,
        visible: true,
      }))
    );
  }, []);

  const handleToggleVisible = (key) => {
    setColumnas((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleReorder = (index, direction) => {
    setColumnas((prev) => {
      const nueva = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nueva.length) return nueva;
      [nueva[index], nueva[targetIndex]] = [nueva[targetIndex], nueva[index]];
      return nueva;
    });
  };

  if (loading) return <div>Cargando inmuebles...</div>;

  if (error)
    return (
      <div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded">
        {error}
      </div>
    );

  const columnasVisibles = columnas.filter((c) => c.visible);

  return (
    <div className="bg-white p-4 shadow rounded w-full">
      {/* Encabezado con título y botón de etiquetas */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Lista de Inmuebles</h2>

        {/* Botón desplegable de etiquetas */}
        <div className="relative w-1/4 min-w-[250px]">
          <button
            onClick={() => setShowEtiquetas(!showEtiquetas)}
            className="w-full flex justify-between items-center bg-gray-100 px-3 py-2 rounded border border-gray-300 hover:bg-gray-200"
          >
            <span className="font-medium text-gray-700">Etiquetas</span>
            {showEtiquetas ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showEtiquetas && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded shadow-lg max-h-72 overflow-auto z-10">
              {columnas.map((col, index) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-50"
                >
                  {/* Icono arrastrar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorder(index, "up")}
                      className="p-1 hover:text-blue-600"
                      title="Mover arriba"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(index, "down")}
                      className="p-1 hover:text-blue-600"
                      title="Mover abajo"
                    >
                      ▼
                    </button>
                    <GripVertical size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{col.label}</span>
                  </div>

                  {/* Checkbox de visibilidad */}
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => handleToggleVisible(col.key)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla dinámica */}
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 text-left">
            {columnasVisibles.map((col) => (
              <th key={col.key} className="px-4 py-2">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inmuebles.map((inmueble) => (
            <tr
              key={inmueble.id}
              className="hover:bg-gray-100 cursor-pointer"
              onClick={() => navigate(`/inmuebles/${inmueble.id}`)}
            >
              {columnasVisibles.map((col) => (
                <td key={col.key} className="px-4 py-2">
                  {renderCell(inmueble, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(inmueble, key) {
  switch (key) {
    case "direccion":
      return inmueble.edificio
        ? `${inmueble.edificio.calle} ${inmueble.edificio.numero_calle}, Planta ${inmueble.planta} Puerta ${inmueble.puerta}`
        : "Sin dirección";
    case "propietario":
      return inmueble.propietario
        ? `${inmueble.propietario.nombre} ${inmueble.propietario.apellido1 || ""}`
        : "Sin propietario";
    case "precio_pedido_cliente":
    case "valoracion":
      return inmueble[key]
        ? `${inmueble[key].toLocaleString()} €`
        : "—";
    default:
      return inmueble[key] || inmueble.edificio?.[key] || "—";
  }
}
