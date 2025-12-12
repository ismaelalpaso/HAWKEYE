import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function NewInmuebleForm() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEdificio, setSelectedEdificio] = useState(null);

  const [planta, setPlanta] = useState("");
  const [puerta, setPuerta] = useState("");
  const [escalera, setEscalera] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // 🔎 Búsqueda de edificios
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No estás autenticado.");

        const res = await api.get(
          `/edificios/?search=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const results = res.data.sort((a, b) => {
          const aStarts = a.calle.toLowerCase().startsWith(searchQuery.toLowerCase()) ? -1 : 1;
          const bStarts = b.calle.toLowerCase().startsWith(searchQuery.toLowerCase()) ? -1 : 1;
          return aStarts - bStarts;
        });

        setSearchResults(results);
      } catch (err) {
        console.error("Error buscando edificios:", err);
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectEdificio = (edificio) => {
    setSelectedEdificio(edificio);
    setSearchQuery(`${edificio.calle} ${edificio.numero_calle}`);
    setSearchResults([]);
  };

  // ✅ Guardar inmueble con el ID correcto del edificio
  const handleGuardar = async () => {
    setError(null);

    if (!selectedEdificio) return setError("Debes seleccionar un edificio.");
    if (!planta || !puerta) return setError("Planta y puerta son obligatorias.");

    const payload = {
      edificio_id: selectedEdificio.id, // ✅ CAMBIO CLAVE
      planta,
      puerta,
      interior: escalera || null,
    };

    setEnviando(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No estás autenticado.");

      await api.post("/inmuebles/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/");
    } catch (err) {
      console.error("Error creando inmueble:", err);
      setError(err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-2/3 p-6 rounded-lg shadow-xl space-y-4 relative">
        <h2 className="text-lg font-semibold">Nuevo Inmueble</h2>

        {/* Búsqueda de Edificio */}
        <div>
          <label className="block text-sm font-medium">Seleccionar Edificio</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedEdificio(null);
            }}
            placeholder="Escribe el nombre de la calle..."
            className="w-full border rounded px-3 py-2 mt-1"
          />
          {searchResults.length > 0 && (
            <div className="border mt-1 rounded bg-white max-h-40 overflow-auto shadow-md">
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectEdificio(r)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {`${r.calle} ${r.numero_calle} (${r.codigo_postal})`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datos del Inmueble */}
        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="block text-sm font-medium">Escalera</label>
            <input
              type="text"
              value={escalera}
              onChange={(e) => setEscalera(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Opcional"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium">Planta</label>
            <input
              type="text"
              value={planta}
              onChange={(e) => setPlanta(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 2"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium">Puerta</label>
            <input
              type="text"
              value={puerta}
              onChange={(e) => setPuerta(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: B"
            />
          </div>
        </div>

        {/* Errores */}
        {error && <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>}

        {/* Botones */}
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
