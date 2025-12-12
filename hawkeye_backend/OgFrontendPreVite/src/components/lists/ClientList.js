import { useEffect, useState } from "react";
import api from "../../api";  // axios configurado con baseURL, etc.
import { Link } from "react-router-dom";

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientes = async () => {
      setError(null);
      setLoading(true);

      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setError("No estás autenticado. Por favor, inicia sesión.");
          setLoading(false);
          return;
        }

        const res = await api.get("/clientes/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientes(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          setError("Token inválido o expirado. Por favor, inicia sesión de nuevo.");
        } else {
          setError("Error al cargar clientes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  if (loading) return <div>Cargando clientes...</div>;

  if (error) return (
    <div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded">
      {error}
    </div>
  );

  return (
    <div className="bg-white p-4 shadow rounded w-full">
      <h2 className="text-xl font-bold mb-4">Lista de Clientes</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Trato</th>
            <th className="px-4 py-2">Sexo</th>
            <th className="px-4 py-2">Tipo Documento</th>
            <th className="px-4 py-2">Dirección</th>
            <th className="px-4 py-2">Info Adicional</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => (
            <tr key={cliente.id} className="hover:bg-gray-100">
              <td className="px-4 py-2">
                <Link to={`/clientes/${cliente.id}`} className="text-blue-600 hover:underline">
                  {cliente.nombre} {cliente.apellido1} {cliente.apellido2 || ""}
                </Link>
              </td>
              <td className="px-4 py-2">{cliente.num_identificacion}</td>
              <td className="px-4 py-2">{cliente.trato}</td>
              <td className="px-4 py-2">{cliente.sexo}</td>
              <td className="px-4 py-2">{cliente.tipo_documento}</td>
              <td className="px-4 py-2">{cliente.direccion}</td>
              <td className="px-4 py-2">{cliente.info_adicional || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
