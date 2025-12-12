import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import api from "../../api";
import NewActivityForm from "../forms/NewActivityForm";
import SearchCliente from "../SearchCliente";
import PropertyMap from "../detail/PropertyMap";
import SaveButton from "../SaveButton";
import SecondaryButton from "../SecondaryButton";
import ActividadCard from "../ActividadCard";


export default function PropertyDetail() {
  const { id } = useParams();
  const [inmueble, setInmueble] = useState(null);
  const [originalInmueble, setOriginalInmueble] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchActivity, setSearchActivity] = useState("");
  const [dragPosition, setDragPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);

    const updatePosition = (clientX) => {
      const slider = e.target.closest(".relative"); // obtiene el slider
      const rect = slider.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos)); // limitar 0-1
      setDragPosition(pos);
    };

    const onMove = (moveEvent) => {
      updatePosition(moveEvent.clientX || moveEvent.touches?.[0].clientX);
    };

    const onUp = (upEvent) => {
      setIsDragging(false);
      const slider = e.target.closest(".relative");
      const rect = slider.getBoundingClientRect();
      let pos = (upEvent.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));

      if (pos < 0.33) {
        handleFieldChange("estado_CRM", "Por defecto");
      } else if (pos < 0.66) {
        handleFieldChange("estado_CRM", "Noticia");
      } else {
        handleFieldChange("estado_CRM", "Encargo");
      }

      setDragPosition(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };


  const fetchInmueble = async () => {
    try {
      const res = await api.get(`/inmuebles/${id}/`);
      setInmueble(res.data);
      setOriginalInmueble(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el inmueble.");
    }
  };

  const fetchActividades = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.get(`/actividades/inmueble/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActividades(res.data);
    } catch (err) {
      console.error("Error cargando actividades:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        await fetchInmueble();
        await fetchActividades();
      } catch {
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Cargando...</div>;
  if (error)
    return <div className="text-red-600 bg-red-100 p-4 rounded">{error}</div>;
  if (!inmueble) return <div>Datos no disponibles.</div>;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("es-ES") : "—";

  const handleFieldChange = (field, value) => {
    setInmueble((prev) => ({ ...prev, [field]: value }));
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Limpieza de datos antes de enviar
      const sanitizedData = Object.fromEntries(
        Object.entries(editedFields).map(([key, value]) => {
          // Convierte números representados como string
          if (["precio_pedido_cliente", "valoracion", "emisiones_CO2", "consumo_energia"].includes(key)) {
            const num = parseFloat(value);
            return [key, isNaN(num) ? null : num];
          }
          return [key, value];
        })
      );

      await api.patch(`/inmuebles/${id}/`, editedFields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchInmueble();
      setEditedFields({});
    } catch (err) {
      console.error("Error guardando:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    setInmueble(originalInmueble);
    setEditedFields({});
  };


    // 🔹 Guardar propietario
  const handleSavePropietario = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const data = { ...inmueble.propietario };
    delete data.id;

    await api.patch(`/clientes/${inmueble.propietario.id}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Propietario actualizado correctamente");

    // 🔹 Recargar inmueble con propietario actualizado
    await fetchInmueble();

  } catch (err) {
    console.error("❌ Error guardando propietario:", err);
    throw err;
  }
};


  // 🔹 Cancelar cambios del propietario
  const onCancelPropietario = async () => {
    await fetchInmueble(); // restaura los datos originales desde la API
  };


  const filteredActivities = actividades.filter((a) => {
    const q = searchActivity.toLowerCase();
    return (
      a.descripcion_empleado?.toLowerCase().includes(q) ||
      a.estado?.toLowerCase().includes(q) ||
      a.usuario_responsable?.username?.toLowerCase().includes(q) ||
      new Date(a.fecha_inicio).toLocaleDateString("es-ES").includes(q)
    );
  });

  return (
    <div className="flex gap-4 w-full relative">
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <NewActivityForm
            inmuebleId={id}
            onCancel={() => setShowForm(false)}
            onCreated={async () => {
              setShowForm(false);
              await fetchActividades();
            }}
          />
        </Modal>
      )}

      {showAllActivities && (
        <Modal onClose={() => setShowAllActivities(false)}>
          <div className="space-y-2.5">
            <h3 className="text-xl font-semibold mb-2.5">Todas las actividades</h3>
            <input
              type="text"
              placeholder="Buscar por fecha, responsable..."
              className="w-full border rounded p-2.5"
              value={searchActivity}
              onChange={(e) => setSearchActivity(e.target.value)}
            />
            <div className="max-h-80 overflow-auto mt-2.5 space-y-2.5">
              {filteredActivities.map((actividad) => (
                <ActividadCard key={actividad.id} actividad={actividad} />
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* IZQUIERDA */}
      <div className="w-2/3 space-y-3.5">
        {/* Encabezado principal */}
        <div className="bg-white rounded shadow p-3.5">
          <h2 className="text-xl font-bold">
            {inmueble.edificio?.calle} {inmueble.edificio?.numero_calle} - Planta{" "}
            {inmueble.planta}, Puerta {inmueble.puerta}
            {inmueble.interior ? `, Interior ${inmueble.interior}` : ""}
          </h2>
        </div>

        {/* 3x2 */}
        <div className="bg-gray-50 rounded shadow p-3.5 grid grid-cols-3 grid-rows-2 gap-2.5">
          <InfoBlock label="Último contacto" value={formatDate(inmueble.fecha_ultimo_contacto)} />
          <InfoBlock label="Ocupado por" value={inmueble.ocupado_por || "—"} />
          <InfoBlock label="Actividades" value={actividades.length} />
          <InfoBlock label="Última venta/alquiler" value={formatDate(inmueble.fecha_ultima_venta_alquiler)} />
          <InfoBlock label="Última modificación" value={formatDate(inmueble.fecha_ultima_modificacion)} />
          <InfoBlock label="Zona asignada" value={inmueble.zona_asignada || "—"} />
        </div>

        {/* Slider Estado CRM - Click + Drag */}
          <div
            className="relative w-full h-10 bg-gray-200 rounded-full overflow-hidden select-none"
            onMouseDown={(e) => handleDragStart(e)}
            onTouchStart={(e) => handleDragStart(e.touches[0])}
          >
            <div
              className={`absolute top-0 h-10 rounded-full transition-all duration-300`}
              style={{
                left:
                  dragPosition !== null
                    ? `${dragPosition * 100}%`
                    : inmueble.estado_CRM === "Por defecto"
                    ? "0%"
                    : inmueble.estado_CRM === "Noticia"
                    ? "33.33%"
                    : "66.66%",
                width: "33.33%",
                background:
                  inmueble.estado_CRM === "Por defecto"
                    ? "#2563eb" // azul
                    : inmueble.estado_CRM === "Noticia"
                    ? "#eab308" // amarillo
                    : "#16a34a", // verde
              }}
            />
            {["Por defecto", "Noticia", "Encargo"].map((estado, index) => (
              <button
                key={estado}
                onClick={() => handleFieldChange("estado_CRM", estado)}
                className="absolute top-0 h-10 w-1/3 text-sm font-semibold text-gray-700 z-10"
                style={{ left: `${index * 33.33}%` }}
              >
                {estado === "Por defecto" ? "Inmueble" : estado}
              </button>
            ))}
          </div>


        {/* Información principal */}
        <h3 className="text-lg font-semibold">Información principal</h3>
        <div className="bg-white border rounded shadow divide-y">
          <EditableSection
            label="Planta"
            value={inmueble.planta}
            onChange={(v) => handleFieldChange("planta", v)}
          />
          <EditableSection
            label="Puerta"
            value={inmueble.puerta}
            onChange={(v) => handleFieldChange("puerta", v)}
          />
          <EditableSection
            label="Interior"
            value={inmueble.interior || "—"}
            onChange={(v) => handleFieldChange("interior", v)}
          />
          <EditableSection
            label="Referencia Catastral"
            value={inmueble.ref_catastral || "—"}
            onChange={(v) => handleFieldChange("ref_catastral", v)}
          />

          {/* ✅ Propietario principal */}
          <EditableSection
            label="Propietario"
            value={
              inmueble.propietario ? (
                <Link
                  to={`/clientes/${inmueble.propietario.id}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {`${inmueble.propietario.nombre} ${inmueble.propietario.apellido1 || ""} ${inmueble.propietario.apellido2 || ""}`.trim()}
                </Link>
              ) : (
                "Sin propietario"
              )
            }
          >
            <SearchCliente
              selected={inmueble.propietario}
              onSelect={(cliente) => handleFieldChange("propietario_id", cliente.id)}
            />
          </EditableSection>
        </div>


        {/* Características del inmueble */}
        <h3 className="text-lg font-semibold mt-2.5">Características del inmueble</h3>
        <div className="flex gap-2.5">
          <div className="w-1/2 bg-white border rounded shadow divide-y">
            <EditableSection label="Habitaciones" value={inmueble.habitaciones} onChange={(v) => handleFieldChange("habitaciones", v)} />
            <EditableSection label="Baños" value={inmueble.banos} onChange={(v) => handleFieldChange("banos", v)} />
            <EditableSection label="Estancias" value={inmueble.estancias} onChange={(v) => handleFieldChange("estancias", v)} />
            <EditableSection label="Balcón" value={inmueble.balcon ? "Sí" : "No"} onChange={(v) => handleFieldChange("balcon", v === "Sí")} />
            <EditableSection label="Jardín" value={inmueble.jardin ? "Sí" : "No"} onChange={(v) => handleFieldChange("jardin", v === "Sí")} />
          </div>
          <div className="w-1/2 bg-white border rounded shadow divide-y">
            <EditableSection label="Certificado Energético" value={inmueble.estado_certificado || "—"} onChange={(v) => handleFieldChange("estado_certificado", v)} />
            <EditableSection label="Consumo Energía" value={inmueble.consumo_energia ?? "—"} onChange={(v) => handleFieldChange("consumo_energia", v)} />
            <EditableSection label="Emisiones CO2" value={inmueble.emisiones_CO2 ?? "—"} onChange={(v) => handleFieldChange("emisiones_CO2", v)} />
            <EditableSection label="Nota Simple" value={inmueble.nota_simple ? "Sí" : "No"} onChange={(v) => handleFieldChange("nota_simple", v === "Sí")} />
            <EditableSection label="Día de Zona" value={formatDate(inmueble.dia_zona)} onChange={(v) => handleFieldChange("dia_zona", v)} />
          </div>
        </div>

        {/* Otros datos del inmueble */}
        <h3 className="text-lg font-semibold mt-2.5">Otros datos del inmueble</h3>
        <div className="bg-white border rounded shadow divide-y">
          <EditableSection label="Motivación" value={inmueble.motivacion} onChange={(v) => handleFieldChange("motivacion", v)} />
          <EditableSection label="Precio pedido cliente" value={inmueble.precio_pedido_cliente ?? "—"} onChange={(v) => handleFieldChange("precio_pedido_cliente", v)} />
          <EditableSection label="Valoración" value={inmueble.valoracion ?? "—"} onChange={(v) => handleFieldChange("valoracion", v)} />
          <EditableSection
            label="Fecha valoración"
            value={formatDate(inmueble.fecha_valoracion)}
            onChange={(v) => handleFieldChange("fecha_valoracion", v)}
          >
            <input
              type="date"
              className="w-full border rounded px-1 py-1 text-sm"
              value={
                inmueble.fecha_valoracion
                  ? new Date(inmueble.fecha_valoracion).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => handleFieldChange("fecha_valoracion", e.target.value)}
              onBlur={(e) => handleFieldChange("fecha_valoracion", e.target.value)}
              autoFocus
            />
          </EditableSection>
          <EditableSection label="Necesidad de venta" value={inmueble.necesidad_venta} onChange={(v) => handleFieldChange("necesidad_venta", v)} />
          <EditableSection label="Prioridad noticia" value={inmueble.prioridad_noticia} onChange={(v) => handleFieldChange("prioridad_noticia", v)} />
          <EditableSection label="Tipo procedencia" value={inmueble.tipo_procedencia} onChange={(v) => handleFieldChange("tipo_procedencia", v)} />
          <EditableSection label="Nota inmueble" value={inmueble.nota_inmueble || "—"} onChange={(v) => handleFieldChange("nota_inmueble", v)} />
          <EditableSection label="Nota noticia" value={inmueble.nota_noticia || "—"} onChange={(v) => handleFieldChange("nota_noticia", v)} />
          <EditableSection label="Comisión" value={inmueble.comision ?? "—"} onChange={(v) => handleFieldChange("comision", v)} />
        </div>

        {/* Footer dinámico */}
        {Object.keys(editedFields).length > 0 && (
          <div className="flex justify-end gap-3.5 mt-3 bg-gray-50 p-2.5 rounded shadow">
            <button
              onClick={handleCancelar}
              className="px-3.5 py-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className={`px-3.5 py-1.5 rounded text-white ${
                saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {/* DERECHA */}
      <div className="w-1/3 space-y-3.5">
        {/* Actividades */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-lg font-semibold">Actividades recientes</h3>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Nueva
            </button>
          </div>
          {actividades.length === 0 ? (
            <p className="text-sm">No hay actividades registradas.</p>
          ) : (
            actividades.slice(0, 2).map((actividad) => (
              <ActividadCard key={actividad.id} actividad={actividad} />
            ))
          )}
          {actividades.length > 2 && (
            <button
              onClick={() => setShowAllActivities(true)}
              className="text-sm text-blue-600 hover:underline mt-1.5"
            >
              Ver más
            </button>
          )}
        </div>


        {/* Datos básicos del propietario */}
        {inmueble.propietario && (
          <div className="bg-white rounded shadow p-2.5">
            <h3 className="text-lg font-semibold mb-1.5">Datos del propietario</h3>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: "nombre", label: "Nombre" },
                { key: "apellido1", label: "Apellido 1" },
                { key: "apellido2", label: "Apellido 2" },
                { key: "telefono", label: "Teléfono" },
                { key: "telefono_movil", label: "Móvil" },
                { key: "email", label: "Email" },
                { key: "direccion", label: "Dirección" },
                { key: "poblacion", label: "Población" },
              ].map((field) => (
                <EditableSection
                  key={field.key}
                  label={field.label}
                  value={inmueble.propietario[field.key] || "—"}
                  onChange={(v) =>
                    setInmueble((prev) => ({
                      ...prev,
                      propietario: { ...prev.propietario, [field.key]: v },
                    }))
                  }
                />
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-3">
              <SecondaryButton
                onClick={onCancelPropietario}
                label="Cancelar"
                workingMessage="Cancelando..."
                successMessage="Restaurado ✅"
              />

              <SaveButton
                onSave={handleSavePropietario}
                label="Guardar cambios"
                successMessage="Guardado ✅"
                errorMessage="Error ❌"
                savingMessage="Guardando..."
              />
            </div>
          </div>
        )}


        {/* RELACIONES DE OCUPACIÓN */}
        <div className="bg-white rounded shadow p-3 mt-4">
          <h3 className="text-lg font-semibold mb-3">Relaciones de ocupación</h3>

          {/* Copropietarios */}
          <EditableSection
            label="Copropietarios"
            value={
              inmueble.copropietarios && inmueble.copropietarios.length > 0 ? (
                <ul className="list-disc list-inside">
                  {inmueble.copropietarios.map((cop) => (
                    <li key={cop.id} className="flex justify-between items-center">
                      <Link
                        to={`/clientes/${cop.id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {`${cop.nombre} ${cop.apellido1 || ""} ${cop.apellido2 || ""}`.trim()}
                      </Link>
                      <button
                        onClick={() =>
                          setInmueble((prev) => ({
                            ...prev,
                            copropietarios: prev.copropietarios.filter((c) => c.id !== cop.id),
                          }))
                        }
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Eliminar copropietario"
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                "Sin copropietarios"
              )
            }
          >
            <SearchCliente
              selected={null}
              onSelect={(cliente) =>
                setInmueble((prev) => ({
                  ...prev,
                  copropietarios: [...(prev.copropietarios || []), cliente],
                }))
              }
            />
          </EditableSection>

          {/* Inquilino */}
          <EditableSection
            label="Inquilino"
            value={
              inmueble.inquilino ? (
                <div className="flex justify-between items-center">
                  <Link
                    to={`/clientes/${inmueble.inquilino.id}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {`${inmueble.inquilino.nombre} ${inmueble.inquilino.apellido1 || ""} ${inmueble.inquilino.apellido2 || ""}`.trim()}
                  </Link>
                  <button
                    onClick={() => handleFieldChange("inquilino_id", null)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Eliminar inquilino"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                "Sin inquilino"
              )
            }
          >
            <SearchCliente
              selected={inmueble.inquilino}
              onSelect={(cliente) => handleFieldChange("inquilino_id", cliente.id)}
            />
          </EditableSection>

          {/* Coinquilinos */}
          <EditableSection
            label="Coinquilinos"
            value={
              inmueble.coinquilinos && inmueble.coinquilinos.length > 0 ? (
                <ul className="list-disc list-inside">
                  {inmueble.coinquilinos.map((coq) => (
                    <li key={coq.id} className="flex justify-between items-center">
                      <Link
                        to={`/clientes/${coq.id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {`${coq.nombre} ${coq.apellido1 || ""} ${coq.apellido2 || ""}`.trim()}
                      </Link>
                      <button
                        onClick={() =>
                          setInmueble((prev) => ({
                            ...prev,
                            coinquilinos: prev.coinquilinos.filter((c) => c.id !== coq.id),
                          }))
                        }
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Eliminar coinquilino"
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                "Sin coinquilinos"
              )
            }
          >
            <SearchCliente
              selected={null}
              onSelect={(cliente) =>
                setInmueble((prev) => ({
                  ...prev,
                  coinquilinos: [...(prev.coinquilinos || []), cliente],
                }))
              }
            />
          </EditableSection>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-4">
            <SecondaryButton
              onClick={async () => {
                await fetchInmueble(); // restaurar datos originales
              }}
              label="Cancelar"
              workingMessage="Cancelando..."
              successMessage="Restaurado ✅"
            />
            <SaveButton
              onSave={async () => {
                try {
                  const token = localStorage.getItem("accessToken");
                  const data = {
                    copropietarios: inmueble.copropietarios.map((c) => c.id),
                    coinquilinos: inmueble.coinquilinos.map((c) => c.id),
                    inquilino_id: inmueble.inquilino ? inmueble.inquilino.id : null,
                  };
                  await api.patch(`/inmuebles/${id}/`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  await fetchInmueble();
                } catch (err) {
                  console.error("❌ Error guardando relaciones:", err);
                }
              }}
              label="Guardar relaciones"
              successMessage="Guardado ✅"
              errorMessage="Error ❌"
              savingMessage="Guardando..."
            />
          </div>
        </div>



        {/* Mapa */}
        <PropertyMap
          latitud={inmueble.edificio?.latitud}
          longitud={inmueble.edificio?.longitud}
          direccion={`${inmueble.edificio?.calle || ""} ${inmueble.edificio?.numero_calle || ""}`}
        />

      </div>
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

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );
}

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