import { Link } from "react-router-dom";

export default function CreateInstanceSelector() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-4">Selecciona tipo de instancia a crear</h2>
      <ul className="space-y-3">
        {[
          { to: "/clientes/nuevo", label: "Crear Cliente" },
          { to: "/solicitudes/nueva", label: "Crear Solicitud" },
          { to: "/inmuebles/nuevo", label: "Crear Inmueble" },  
          { to: "/edificios/nuevo", label: "Crear Edificio" }
        ].map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="
                block px-4 py-2
                bg-azul-falcon text-white rounded
                hover:bg-naranja-falcon
                hover:animate-hover-fade
                transition-colors duration-2000
              "
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
