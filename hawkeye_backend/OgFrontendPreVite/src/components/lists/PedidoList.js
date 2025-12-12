// src/components/PedidoList.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../api";
import { Link } from "react-router-dom"; // asegúrate de tenerlo arriba

export default function PedidoList() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEtiquetas, setShowEtiquetas] = useState(false);
  const [columnas, setColumnas] = useState([]);
  const navigate = useNavigate();

  // ✅ Campos reales del modelo Pedido
  const todasLasColumnas = [
    { key: "cliente", label: "Cliente" },
    { key: "telefono", label: "Teléfono" },
    { key: "email", label: "Email" },
    { key: "ubicaciones", label: "Zonas de interés" },
    { key: "precio_min", label: "Precio Mínimo (€)" },
    { key: "precio_max", label: "Precio Máximo (€)" },
    { key: "superficie_min", label: "Superficie Mín (m²)" },
    { key: "superficie_max", label: "Superficie Máx (m²)" },
    { key: "habitaciones", label: "Dormitorios" },
    { key: "banos", label: "Baños" },
    { key: "balcon", label: "Balcón" },
    { key: "jardin", label: "Jardín" },
    { key: "info_financiacion", label: "Financiación" },
    { key: "fecha_ultima_modificacion", label: "Última modificación" },
  ];

  // 🔹 Obtener pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      setError(null);
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const res = await api.get("/pedidos/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPedidos(res.data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los pedidos.");
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  // Inicializar columnas visibles
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

  if (loading) return <div>Cargando pedidos...</div>;
  if (error)
    return (
      <div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded">
        {error}
      </div>
    );

  const columnasVisibles = columnas.filter((c) => c.visible);

  return (
    <div className="bg-white p-4 shadow rounded w-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Solicitudes de Compra / Pedidos</h2>

        {/* Etiquetas */}
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

      {/* Tabla */}
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
          {pedidos.map((pedido) => (
            <tr
              key={pedido.id}
              className="hover:bg-gray-100 cursor-pointer"
              onClick={() => navigate(`/solicitudes/${pedido.id}`)}
            >
              {columnasVisibles.map((col) => (
                <td key={col.key} className="px-4 py-2">
                  {renderCell(pedido, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(pedido, key) {
  switch (key) {
    case "cliente":
      return pedido.cliente ? (
        <Link
          to={`/pedidos/${pedido.id}`}
          className="text-blue-600 hover:underline"
        >
          {pedido.cliente.nombre} {pedido.cliente.apellido1 || ""}
        </Link>
      ) : (
        "—"
      );

    case "telefono":
      return pedido.cliente?.telefono_movil || pedido.cliente?.telefono || "—";

    case "email":
      return pedido.cliente?.email || "—";

    case "precio_min":
    case "precio_max":
      return pedido[key] ? `${pedido[key].toLocaleString()} €` : "—";

    case "balcon":
    case "jardin":
      return pedido[key] ? "Sí" : "No";

    case "fecha_ultima_modificacion":
      return new Date(pedido.fecha_ultima_modificacion).toLocaleDateString("es-ES");

    default:
      return pedido[key] ?? "—";
  }
}

