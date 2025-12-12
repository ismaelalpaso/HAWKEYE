// src/components/ActividadCardUser.jsx
export default function ActividadCardUser({ actividad, onClick }) {
  const inicio = new Date(actividad.fecha_inicio);
  const fin = new Date(actividad.fecha_fin);

  const horaInicio = inicio.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const horaFin = fin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const tipoColor = {
    "Adquisición": "bg-yellow-200 text-yellow-800",
    "Visita": "bg-blue-200 text-blue-800",
    "Llamada": "bg-green-200 text-green-800",
    "Contacto directo": "bg-red-200 text-red-800",
    "Genérica": "bg-gray-200 text-gray-800",
    "Zona": "bg-orange-200 text-orange-800",
    "Reunión o curso": "bg-purple-200 text-purple-800",
  };

  // Obtener nombre completo del responsable
  const responsable = actividad?.usuario_responsable
    ? `${actividad.usuario_responsable.first_name || ""} ${actividad.usuario_responsable.last_name || ""}`.trim()
      || actividad.usuario_responsable.username
    : "Usuario no disponible";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white shadow p-3 rounded border border-gray-200 hover:border-blue-500 hover:shadow-md transition space-y-2"
    >
      {/* Tipo + Horario */}
      <div className="flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded ${tipoColor[actividad.tipo] || "bg-gray-200 text-gray-700"}`}>
          {actividad.tipo}
        </span>
        <span className="text-xs text-gray-500">{horaInicio} - {horaFin}</span>
      </div>

      {/* Inmueble */}
      <div>
        <p className="text-gray-500 text-xs">Inmueble</p>
        <p className="text-sm font-medium">
          {actividad.inmueble?.ref_catastral || actividad.inmueble?.direccion || "Inmueble"}
        </p>
      </div>

      {/* Agencia + Responsable */}
      <div className="border border-blue-600 rounded p-2 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500 text-xs">Agencia</p>
            <p>Falcon Group - Tarragona</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Responsable</p>
            <p>{responsable}</p>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <p className="text-xs text-gray-500">Descripción</p>
        <p className="text-sm text-gray-800">{actividad.descripcion_empleado || actividad.descripcion_publica || "Sin descripción"}</p>
      </div>
    </div>
  );
}
