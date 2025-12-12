import { useState, useEffect } from "react";
import api from "../api";

export default function SearchInmueble({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

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
        const res = await api.get(`/inmuebles/?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ordered = res.data.sort((a, b) => {
          const qa = `${a.calle || ""} ${a.numero || ""}`.toLowerCase();
          const qb = `${b.calle || ""} ${b.numero || ""}`.toLowerCase();
          const q = query.toLowerCase();
          const startsA = qa.startsWith(q);
          const startsB = qb.startsWith(q);
          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;
          return qa.localeCompare(qb);
        });

        setResults(ordered);
      } catch (err) {
        console.error("Error buscando inmuebles:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div>
      <label className="block text-sm font-medium">Buscar inmueble</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Calle y número..."
        className="w-full border rounded px-3 py-2 mt-1"
      />
      {searching && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
      {results.length > 0 && (
        <div className="border mt-1 rounded bg-white max-h-40 overflow-auto shadow-md">
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                onSelect(r);
                setQuery(`${r.calle || ""} ${r.numero || ""}`.trim());
                setResults([]);
              }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
            >
              {`${r.calle || ""} ${r.numero || ""}`.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
