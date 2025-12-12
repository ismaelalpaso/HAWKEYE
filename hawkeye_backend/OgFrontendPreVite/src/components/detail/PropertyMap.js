import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-minimap/dist/Control.MiniMap.min.css";
import "leaflet-minimap";

// ✅ Icono personalizado del marcador
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

export default function PropertyMap({ latitud, longitud, direccion }) {
  useEffect(() => {
    if (!latitud || !longitud) return;

    const lastLayer = localStorage.getItem("propertyMapLayer") || "street";

    const map = L.map("property-map", {
      center: [latitud, longitud],
      zoom: 18, // ✅ acercamos más por defecto
      maxZoom: 20, // ✅ zoom máximo permitido
      zoomControl: true,
      attributionControl: false, // ✅ footer eliminado
    });

    // ✅ Capas base con máximo zoom
    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
      maxZoom: 20,
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 20 }
    );

    if (lastLayer === "satellite") {
      satellite.addTo(map);
    } else {
      street.addTo(map);
    }

    const baseMaps = { "Vista de calles": street, "Vista satélite": satellite };
    L.control.layers(baseMaps).addTo(map);

    map.on("baselayerchange", (e) =>
      localStorage.setItem("propertyMapLayer", e.name === "Vista satélite" ? "satellite" : "street")
    );

    // ✅ Marcador funcional
    const marker = L.marker([latitud, longitud], { icon: markerIcon })
      .addTo(map)
      .bindPopup(`<b>${direccion || "Ubicación del inmueble"}</b>`)
      .openPopup();

    // ✅ Botón reinicio vista
    const resetView = L.control({ position: "topleft" });
    resetView.onAdd = function () {
      const btn = L.DomUtil.create("button", "leaflet-bar leaflet-control");
      btn.innerHTML = "⟳";
      btn.style.background = "white";
      btn.style.cursor = "pointer";
      btn.style.width = "30px";
      btn.style.height = "30px";
      btn.onclick = () => {
        map.setView([latitud, longitud], 18);
        marker.openPopup();
      };
      return btn;
    };
    resetView.addTo(map);

    // ✅ MiniMapa
    const miniMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
    });
    new L.Control.MiniMap(miniMapLayer, {
      toggleDisplay: true,
      minimized: false,
      position: "bottomright",
    }).addTo(map);

    // ✅ Animación controlada con hover (funcionando)
    const mapContainer = document.getElementById("property-map");
    let hoverStart = null;

    mapContainer.style.transformOrigin = "center center";

    mapContainer.onmouseenter = () => {
      hoverStart = Date.now();
      mapContainer.style.transition = "transform 0.3s ease";
      mapContainer.style.transform = "perspective(800px) rotateX(8deg)"; // inclinación moderada
    };

    mapContainer.onmouseleave = () => {
      const hoverDuration = Date.now() - hoverStart;
      mapContainer.style.transition =
        hoverDuration > 5000 ? "transform 4s ease" : "transform 0.3s ease";
      mapContainer.style.transform = "none";
    };

    return () => {
      map.remove();
    };
  }, [latitud, longitud, direccion]);

  return (
    <div 
      id="property-map"
      className="w-full h-64 rounded shadow border relative z-0"
      style={{ minHeight: "340px" }}
    />
  );
}
