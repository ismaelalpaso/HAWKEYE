import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function NewClientForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    trato: "Sr.",
    sexo: "M",
    tipo_documento: "DNI",
    num_identificacion: "",
    direccion: "",
    info_adicional: "",
    telefono: "",
    telefono_movil: "",
    email: "",
    email_secundario: "",
  });

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    setError(null);

    if (!formData.nombre || !formData.apellido1) {
      return setError("El nombre y el primer apellido son obligatorios.");
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No estás autenticado.");

      await api.post("/clientes/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/"); // vuelve a la página principal tras guardar
    } catch (err) {
      console.error("Error creando cliente:", err);
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
        <h2 className="text-lg font-semibold">Nuevo Cliente</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: Juan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Primer Apellido</label>
            <input
              name="apellido1"
              value={formData.apellido1}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Segundo Apellido (opcional)
            </label>
            <input
              name="apellido2"
              value={formData.apellido2}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: Gómez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Trato</label>
            <select
              name="trato"
              value={formData.trato}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Sr.">Sr.</option>
              <option value="Sra.">Sra.</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Sexo</label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tipo de Documento</label>
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="DNI">DNI</option>
              <option value="NIF">NIF</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Número de Documento</label>
            <input
              name="num_identificacion"
              value={formData.num_identificacion}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 12345678A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Dirección</label>
            <input
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: Calle Mayor 123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 977123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Teléfono Móvil</label>
            <input
              name="telefono_movil"
              value={formData.telefono_movil}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 600123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: ejemplo@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email Secundario</label>
            <input
              type="email"
              name="email_secundario"
              value={formData.email_secundario}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: secundario@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Información Adicional</label>
          <textarea
            name="info_adicional"
            value={formData.info_adicional}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Notas sobre el cliente..."
          />
        </div>

        {error && (
          <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={enviando}
            className={`px-4 py-2 rounded text-white ${
              enviando
                ? "bg-blue-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
