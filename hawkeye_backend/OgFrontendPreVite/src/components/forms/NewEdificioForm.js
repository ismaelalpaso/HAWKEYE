import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Icono del marcador (necesario para Leaflet)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

function LocationPicker({ setCoordinates }) {
  useMapEvents({
    click(e) {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function NewEdificioForm() {
  const navigate = useNavigate();
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [tipoFinca, setTipoFinca] = useState("Residencial");
  const [fincaVertical, setFincaVertical] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: 41.3851, lng: 2.1734 }); // Centro inicial: Barcelona
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleGuardar = async () => {
    setError(null);

    if (!calle || !numero || !tipoFinca || !coordinates.lat || !coordinates.lng) {
      return setError("Todos los campos y la ubicación son obligatorios.");
    }

    const payload = {
      calle,
      numero_calle: numero,
      tipo_finca: tipoFinca,
      finca_vertical: fincaVertical,
      latitud: coordinates.lat,
      longitud: coordinates.lng,
    };

    setEnviando(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No estás autenticado.");

      await api.post("/edificios/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/"); // Volver a página principal
    } catch (err) {
      console.error("Error creando edificio:", err);
      setError(err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-2/3 p-6 rounded-lg shadow-xl space-y-4 relative">
        <h2 className="text-lg font-semibold">Nuevo Edificio</h2>

        {/* Calle y número */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Calle</label>
            <input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: Gran Via"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium">Número</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: 123"
            />
          </div>
        </div>

        {/* Tipo de finca y división */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Tipo de finca</label>
            <select
              value={tipoFinca}
              onChange={(e) => setTipoFinca(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Terreno">Terreno</option>
              <option value="Parking">Parking</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">¿División vertical?</label>
            <input
              type="checkbox"
              checked={fincaVertical}
              onChange={(e) => setFincaVertical(e.target.checked)}
              className="h-5 w-5"
            />
          </div>
        </div>

        {/* Mapa interactivo */}
        <div>
          <label className="block text-sm font-medium">Selecciona ubicación</label>
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={15}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[coordinates.lat, coordinates.lng]}
              icon={markerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  setCoordinates({ lat, lng });
                },
              }}
            />
            <LocationPicker setCoordinates={setCoordinates} />
          </MapContainer>
          <p className="text-xs text-gray-500 mt-1">
            Lat: {coordinates.lat.toFixed(6)} | Lng: {coordinates.lng.toFixed(6)}
          </p>
        </div>

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
