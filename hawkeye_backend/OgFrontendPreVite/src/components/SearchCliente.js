import { useState, useEffect } from "react";
import api from "../api";

export default function SearchCliente({ onSelect, selected }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(selected || null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No autenticado");

        const res = await api.get(`/clientes/?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Ordenamos por similitud
        const ordered = res.data.sort((a, b) => {
          const qa =
            a.nombre_apellidos_completo ||
            `${a.nombre} ${a.apellido1} ${a.apellido2 || ""}`.toLowerCase();
          const qb =
            b.nombre_apellidos_completo ||
            `${b.nombre} ${b.apellido1} ${b.apellido2 || ""}`.toLowerCase();
          const q = query.toLowerCase();
          const startsA = qa.startsWith(q);
          const startsB = qb.startsWith(q);
          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;
          return qa.localeCompare(qb);
        });

        setResults(ordered);
      } catch (err) {
        console.error("Error buscando clientes:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (cliente) => {
    setSelectedCliente(cliente);
    onSelect(cliente);
    setResults([]);
    setQuery("");
  };

  const handleChangeCliente = () => {
    setSelectedCliente(null);
    setQuery("");
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">Buscar cliente</label>

      {selectedCliente ? (
        <div className="flex items-center justify-between bg-gray-50 border rounded p-2">
          <span className="text-sm font-medium">
            {selectedCliente.nombre_apellidos_completo ||
              `${selectedCliente.nombre} ${selectedCliente.apellido1} ${
                selectedCliente.apellido2 || ""
              }`.trim()}
          </span>
          <button
            onClick={handleChangeCliente}
            className="text-xs text-blue-600 hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o apellidos..."
            className="w-full border rounded px-3 py-2"
          />
          {searching && <p className="text-xs text-gray-500">Buscando...</p>}
          {results.length > 0 && (
            <div className="border mt-1 rounded bg-white max-h-40 overflow-auto shadow-md">
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {r.nombre_apellidos_completo ||
                    `${r.nombre} ${r.apellido1} ${r.apellido2 || ""}`.trim()}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
