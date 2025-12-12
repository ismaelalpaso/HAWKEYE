

export default function ActividadCard({ actividad }) {
  return (
    <div className="bg-white shadow p-2.5 rounded border border-gray-200 hover:border-blue-500 space-y-1.5">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-700">{actividad.tipo || "—"}</p>
        <div className="text-sm text-gray-500">
          {actividad.fecha_inicio
            ? new Date(actividad.fecha_inicio).toLocaleDateString("es-ES")
            : "—"}
        </div>
      </div>
      <p className="text-sm font-medium">
        {actividad.inmueble?.ref_catastral || "Inmueble"}
      </p>
      <div className="border border-blue-600 rounded p-1.5 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500 text-xs">Agencia</p>
            <p>Falcon Group - Tarragona</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Responsable</p>
            <p>
              {actividad.usuario_responsable
                ? `${actividad.usuario_responsable.first_name || ""} ${actividad.usuario_responsable.last_name || ""}`.trim() ||
                  actividad.usuario_responsable.username
                : "Usuario no disponible"}
            </p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mt-1.5">Descripción</p>
        <p className="text-sm">{actividad.descripcion_empleado || "Sin descripción"}</p>
      </div>
    </div>
  );
}
