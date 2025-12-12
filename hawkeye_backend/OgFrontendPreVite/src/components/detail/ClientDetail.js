import { useEffect, useState } from "react";
import api from "../../api";
import { Pencil, ChevronDown } from "lucide-react";
import NewActivityForm from "../forms/NewActivityForm";
import { Link, useParams } from "react-router-dom";
import NewPedidoForm from "../forms/NewPedidoForm";


export default function ClientDetail() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPedidoForm, setShowPedidoForm] = useState(false); // ✅ NUEVO estado para pedidos
  

  const fetchCliente = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No estás autenticado. Por favor, inicia sesión.");
    const res = await api.get(`/clientes/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCliente(res.data);
  };

  const fetchActividades = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No estás autenticado. Por favor, inicia sesión.");
    const res = await api.get(`/actividades/cliente/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setActividades(res.data);
  };

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        await fetchCliente();
        await fetchActividades();
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
          setError("No se encontró el cliente con este ID.");
        } else if (err.response?.status === 401) {
          setError("Token inválido o expirado. Por favor, inicia sesión de nuevo.");
        } else {
          setError(err.response?.data?.detail || err.message || "Error al cargar los datos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>Cargando cliente y actividades...</div>;

  if (error)
    return (
      <div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded">
        <p className="font-bold">Error al cargar los datos:</p>
        <p>{error}</p>
      </div>
    );

  if (!cliente) return <div>Datos del cliente vacíos o mal formateados.</div>;

  return (
    <div className="flex gap-4 w-full relative">
      {/* MODAL: NUEVA ACTIVIDAD */}
      {showForm && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[40rem] max-w-full relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-sm"
              aria-label="Cerrar formulario"
            >
              ✕
            </button>
            <NewActivityForm
              clienteId={id}
              clienteNombre={cliente.nombre}
              clienteApellido1={cliente.apellido1}
              clienteApellido2={cliente.apellido2}
              onCancel={() => setShowForm(false)}
              onCreated={async () => {
                setShowForm(false);
                try {
                  await fetchActividades();
                } catch (err) {
                  console.error("Error recargando actividades:", err);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PEDIDO ✅ */}
      {showPedidoForm && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[40rem] max-w-full relative">
            <button
              onClick={() => setShowPedidoForm(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-sm"
            >
              ✕
            </button>
            <NewPedidoForm
              clienteId={cliente.id}
              onCancel={() => setShowPedidoForm(false)}
              onCreated={async () => {
                setShowPedidoForm(false);
                await fetchCliente();
              }}
            />
          </div>
        </div>
      )}

      {/* Sección izquierda */}
      <div className="w-2/3 space-y-4">
        {/* Panel superior con información clave */}
        <div className="bg-gray-50 rounded shadow p-4 grid grid-cols-3 grid-rows-2 gap-4">
          <InfoBlock label="Último contacto" value={cliente.ultimo_contacto || "—"} />
          <InfoBlock label="Pedidos" value={cliente.pedidos?.length || 0} />
          <InfoBlock label="Inmuebles" value={cliente.inmuebles?.length || 0} />
          <InfoBlock label="Interés" value={cliente.interes || "—"} />
          <InfoBlock label="Actividades" value={actividades.length} />
          <InfoBlock label="Días desde contacto" value={cliente.dias_ultimo_contacto || "—"} />
        </div>

        {/* Información general del cliente */}
        <div className="flex gap-4">
          <div className="w-1/2 bg-white border rounded shadow divide-y">
            <EditableSection label="Nombre" value={cliente.nombre || "—"} />
            <EditableSection label="Primer apellido" value={cliente.apellido1 || "—"} />
            <EditableSection label="Segundo apellido" value={cliente.apellido2 || "—"} />
            <EditableSection label="Dirección" value={cliente.direccion || "—"} />
            <EditableSection label="Población" value={cliente.poblacion || "—"} />
            <EditableSection label="Tipo Documento" value={cliente.tipo_documento || "—"} />
            <EditableSection label="Nº Identificación" value={cliente.num_identificacion || "—"} />
            <EditableSection label="Trato" value={cliente.trato || "—"} />
            <EditableSection label="Sexo" value={cliente.sexo || "—"} />
          </div>

          <div className="w-1/2 bg-white border rounded shadow divide-y">
            <EditableSection label="Teléfono" value={cliente.telefono || "—"} />
            <EditableSection label="Móvil" value={cliente.telefono_movil || "—"} />
            <EditableSection label="Email" value={cliente.email || "—"} />
            <EditableSection label="Email secundario" value={cliente.email_secundario || "—"} />
            <EditableSection label="Información adicional" value={cliente.info_adicional || "—"} />
            <EditableSection label="Días desde último contacto" value={cliente.dias_ultimo_contacto || "—"} />
            <EditableSection label="Interés" value={cliente.interes || "—"} />
            <EditableSection
              label="Fecha última modificación"
              value={new Date(cliente.fecha_ultima_modificacion).toLocaleString("es-ES")}
            />
          </div>
        </div>
      </div>

      {/* Sección derecha */}
      <div className="w-1/3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Actividades y Citas</h3>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Nueva
          </button>
        </div>

        {actividades.length === 0 ? (
          <p>No hay actividades registradas.</p>
        ) : (
          actividades.map((actividad) => (
            <ActividadCard key={actividad.id || actividad.fecha_inicio} actividad={actividad} />
          ))
        )}

        <button className="text-sm text-blue-600 hover:underline">Ver más</button>

        {/* Inmuebles relacionados */}
        {(() => {
          const inmueblesRelacionados = [
            ...(cliente.propiedades || []),
            ...(cliente.alquileres || []),
            ...(cliente.copropiedades || []),
            ...(cliente.coalquileres || []),
          ];

          return inmueblesRelacionados.length > 0 ? (
            <div className="bg-white rounded shadow p-3 mt-4 w-full">
              <h3 className="text-lg font-semibold mb-2">Inmuebles relacionados</h3>
              <div className="space-y-2">
                {inmueblesRelacionados.map((inmueble) => (
                  <div
                    key={inmueble.id}
                    className="border border-gray-200 rounded p-2 hover:border-blue-400 transition"
                  >
                    <Link
                      to={`/inmuebles/${inmueble.id}`}
                      className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                    >
                      {inmueble.edificio?.calle || "Calle desconocida"}{" "}
                      {inmueble.edificio?.numero_calle || ""}
                    </Link>

                    <p className="text-sm text-gray-600">
                      Planta {inmueble.planta || "—"}, Puerta {inmueble.puerta || "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Ref. Catastral: {inmueble.ref_catastral || "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Estado CRM: {inmueble.estado_CRM || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded shadow p-3 mt-4 w-full">
              <h3 className="text-lg font-semibold mb-2">Inmuebles relacionados</h3>
              <p className="text-sm text-gray-600">
                No hay inmuebles relacionados con este cliente.
              </p>
            </div>
          );
        })()}

        {/* Pedidos del cliente */}
        {Array.isArray(cliente.pedidos) && cliente.pedidos.length > 0 ? (
          <div className="bg-white rounded shadow p-3 mt-4 w-full">
            <h3 className="text-lg font-semibold mb-2">Pedidos / Solicitudes</h3>
            <div className="space-y-2">
              {cliente.pedidos.map((p) => {
                // Guardas por si llegara algún pedido sin id (evita enviar a ruta inválida)
                if (!p?.id) return null;
                return (
                  <div
                    key={p.id}
                    className="border border-gray-200 rounded p-2 hover:border-blue-400 transition"
                  >
                    <Link
                      to={`/solicitudes/${p.id}`}
                      className="font-semibold text-gray-800 hover:text-blue-600 underline"
                    >
                      {`${p.cliente?.apellido1 || ""} ${p.cliente?.apellido2 || ""}`.trim() ||
                        "Cliente desconocido"}{" "}
                      —{" "}
                      {p.tipo_operacion
                        ? p.tipo_operacion.charAt(0).toUpperCase() + p.tipo_operacion.slice(1)
                        : "Operación"}{" "}
                      {p.subtipo_inmueble
                        ? `de ${p.subtipo_inmueble.charAt(0).toUpperCase() + p.subtipo_inmueble.slice(1)}`
                        : ""}
                    </Link>

                    <p className="text-sm text-gray-600">
                      Tipo principal: {p.tipo_inmueble || "—"} · Prioridad: {p.prioridad ?? "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Última modificación:{" "}
                      {p.fecha_ultima_modificacion
                        ? new Date(p.fecha_ultima_modificacion).toLocaleString("es-ES")
                        : "—"}
                    </p>

                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow p-3 mt-4 w-full">
            <h3 className="text-lg font-semibold mb-2">Pedidos / Solicitudes</h3>
            <p className="text-sm text-gray-600">Este cliente no tiene pedidos todavía.</p>
          </div>
        )}



        {/* Botón para nuevo pedido */}
        <div className="mt-2">
          <button
            onClick={() => setShowPedidoForm(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Nuevo Pedido
          </button>
        </div>

        {/* Modal de nuevo pedido */}
        {showPedidoForm && (
          <div className="absolute inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[40rem] max-w-full relative">
              <button
                onClick={() => setShowPedidoForm(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-sm"
                aria-label="Cerrar formulario"
              >
                ✕
              </button>
              <NewPedidoForm
                clienteId={id}
                onCancel={() => setShowPedidoForm(false)}
                onCreated={async () => {
                  setShowPedidoForm(false);
                  await fetchCliente(); // 🔥 recarga datos del cliente sin recargar toda la página
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function EditableSection({ label, value }) {
  return (
    <div className="p-4 relative group">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm">{value}</p>
      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <Pencil size={16} className="text-blue-500" />
      </button>
    </div>
  );
}

function ActividadCard({ actividad }) {
  return (
    <div className="bg-white shadow p-4 rounded border border-gray-200 hover:border-blue-500 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-700">{actividad.tipo || "—"}</p>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>
            {actividad.fecha_inicio
              ? new Date(actividad.fecha_inicio).toLocaleDateString()
              : "—"}
          </span>
          <button>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <p className="text-sm font-medium">{actividad.cliente?.nombre || "Cliente"}</p>

      <div className="border border-blue-600 rounded p-2 mt-[0.625rem] text-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500">Agencia</p>
            <p>Falcon Group - Tarragona</p>
          </div>
          <div>
            <p className="text-gray-500">Responsable</p>
            <p>{actividad.creado_por?.username || "Usuario no disponible"}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500 mt-2">Descripción</p>
        <p className="text-sm">{actividad.descripcion_empleado || "Sin descripción"}</p>
      </div>
    </div>
  );
}
