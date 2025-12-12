import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import SearchCliente from "../SearchCliente";

export default function NewPedidoForm({ clienteId = null, onCancel, onCreated }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cliente_id: clienteId || null,
    tipo_pedido: "",
    tipo_inmueble: "",
    subtipo_inmueble: "",
    presupuesto: "",
    prioridad: 3,
  });

  const [clienteNombre, setClienteNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const subtiposPorTipo = {
    Piso: ["Ático", "Dúplex", "Estudio", "Loft", "Planta baja", "Piso estándar"],
    Casa: ["Chalet", "Adosado", "Pareado", "Casa de pueblo", "Masía"],
    Local: ["Comercial", "Restaurante", "Bar", "Tienda", "Oficina compartida"],
    Oficina: ["Despacho", "Coworking", "Centro de negocios"],
    Solar: ["Urbanizable", "Rústico", "Industrial"],
    Garaje: ["Coche", "Moto", "Trastero"],
    Nave: ["Industrial", "Logística", "Almacenaje"],
    Terreno: ["Agrícola", "Urbanizable", "No urbanizable"],
  };

  // 🔹 Si viene un clienteId, carga nombre
  useEffect(() => {
    if (clienteId) {
      fetchClienteInfo(clienteId);
      setFormData((prev) => ({ ...prev, cliente_id: clienteId }));
    }
  }, [clienteId]);

  const fetchClienteInfo = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.get(`/clientes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const c = res.data;
      setClienteNombre(`${c.nombre} ${c.apellido1 || ""} ${c.apellido2 || ""}`.trim());
    } catch (err) {
      console.error("Error cargando nombre del cliente:", err);
      setClienteNombre("Cliente no disponible");
    }
  };

  // 🔹 Manejo de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tipo_inmueble") {
      setFormData((prev) => ({
        ...prev,
        tipo_inmueble: value,
        subtipo_inmueble: "", // reset al cambiar tipo
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "prioridad" ? Number(value) : value,
    }));
  };

  // 🔹 Guardar pedido
  const handleGuardar = async () => {
    setError(null);

    if (!formData.cliente_id || !formData.tipo_pedido || !formData.tipo_inmueble) {
      return setError("Cliente, tipo de pedido y tipo de inmueble son obligatorios.");
    }

    const payload = {
      cliente: formData.cliente_id,
      tipo_pedido: formData.tipo_pedido,
      tipo_inmueble: formData.tipo_inmueble,
      subtipo_inmueble: formData.subtipo_inmueble,
      presupuesto: formData.presupuesto,
      prioridad: formData.prioridad,
    };

    setEnviando(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No estás autenticado.");

      await api.post("/pedidos/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (onCreated) onCreated();
      else navigate("/solicitudes");
    } catch (err) {
      console.error("Error creando pedido:", err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data, null, 2)
          : err.message
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-2/3 p-6 rounded-lg shadow-xl space-y-4 relative">
        <h2 className="text-lg font-semibold">Nuevo Pedido</h2>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          {clienteId ? (
            <div>
              <input
                type="text"
                value={clienteNombre ? clienteNombre : "Cargando..."}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
              />
              <input type="hidden" value={formData.cliente_id || ""} name="cliente" />
            </div>
          ) : (
            <SearchCliente
              selected={formData.cliente_id}
              onSelect={(cliente) =>
                setFormData((prev) => ({
                  ...prev,
                  cliente_id: cliente.id,
                }))
              }
            />
          )}
        </div>

        {/* Datos del pedido */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo de pedido */}
          <div>
            <label className="block text-sm font-medium">Tipo de Pedido</label>
            <select
              name="tipo_pedido"
              value={formData.tipo_pedido}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              <option value="Compra">Compra</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Traspaso">Traspaso</option>
            </select>
          </div>

          {/* Tipo de inmueble */}
          <div>
            <label className="block text-sm font-medium">Tipo de Inmueble</label>
            <select
              name="tipo_inmueble"
              value={formData.tipo_inmueble}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {Object.keys(subtiposPorTipo).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Subtipo */}
          <div>
            <label className="block text-sm font-medium">Subtipo de Inmueble</label>
            <select
              name="subtipo_inmueble"
              value={formData.subtipo_inmueble}
              onChange={handleChange}
              disabled={!formData.tipo_inmueble}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {formData.tipo_inmueble &&
                subtiposPorTipo[formData.tipo_inmueble].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block text-sm font-medium">Presupuesto (€)</label>
            <input
              type="number"
              name="presupuesto"
              value={formData.presupuesto}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 150000"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium">Prioridad (1 a 5)</label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value={1}>1 - Muy baja</option>
              <option value={2}>2 - Baja</option>
              <option value={3}>3 - Media</option>
              <option value={4}>4 - Alta</option>
              <option value={5}>5 - Muy alta</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>}

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel || (() => navigate("/solicitudes"))}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={enviando}
            className={`px-4 py-2 rounded text-white ${
              enviando ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
