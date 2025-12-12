import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const NewCalendarActivity = ({ date, onClose }) => {
  // Validar que date es válido, si no usar ahora mismo
  const safeDate = date && dayjs(date).isValid() ? dayjs(date) : dayjs();

  // Estado inicial para el form, fecha_fin 1h después fecha_inicio
  const [formData, setFormData] = useState({
    tipo: "Visita",
    estado: "En proceso",
    fecha_inicio: safeDate.format("YYYY-MM-DDTHH:mm"),
    fecha_fin: safeDate.add(1, "hour").format("YYYY-MM-DDTHH:mm"),
    descripcion_empleado: "",
    descripcion_publica: "",
    cliente: "",
    inmueble: "",
    pedido: "",
  });

  // Si cambia el prop date, actualizar fechas inicio y fin
  useEffect(() => {
    if (date && dayjs(date).isValid()) {
      const newStart = dayjs(date);
      setFormData((f) => ({
        ...f,
        fecha_inicio: newStart.format("YYYY-MM-DDTHH:mm"),
        fecha_fin: newStart.add(1, "hour").format("YYYY-MM-DDTHH:mm"),
      }));
    }
  }, [date]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Controlar que fecha_fin no sea anterior a fecha_inicio
    if (name === "fecha_inicio") {
      const newStart = dayjs(value);
      const currentEnd = dayjs(formData.fecha_fin);
      let newEnd = currentEnd.isBefore(newStart) ? newStart.add(1, "hour") : currentEnd;

      setFormData((prev) => ({
        ...prev,
        fecha_inicio: value,
        fecha_fin: newEnd.format("YYYY-MM-DDTHH:mm"),
      }));
    } else if (name === "fecha_fin") {
      // Permitir solo fechas >= fecha_inicio
      const newEnd = dayjs(value);
      const currentStart = dayjs(formData.fecha_inicio);
      if (newEnd.isBefore(currentStart)) {
        // No actualizamos si es menor
        return;
      }
      setFormData((prev) => ({
        ...prev,
        fecha_fin: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const cleanData = (data) => {
    const parseField = (val) => {
      if (val === "") return null;
      if (!isNaN(val) && val.trim() !== "") return parseInt(val);
      return val;
    };

    return {
      ...data,
      cliente: parseField(data.cliente),
      inmueble: parseField(data.inmueble),
      pedido: parseField(data.pedido),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica de fechas
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert("Por favor, indica fecha y hora válidas");
      return;
    }

    const cleanedData = cleanData(formData);

    try {
      const response = await fetch("/api/actividades/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        onClose();
      } else {
        const err = await response.json();
        console.error("Error creating activity", err);
        alert("Error al crear actividad");
      }
    } catch (err) {
      console.error("Request failed", err);
      alert("Error en la conexión");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Nueva Actividad</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="Adquisición">Adquisición</option>
            <option value="Visita">Visita</option>
            <option value="Llamada">Llamada</option>
            <option value="Contacto directo">Contacto directo</option>
          </select>

          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="Realizada">Realizada</option>
            <option value="No realizada">No realizada</option>
            <option value="En proceso">En proceso</option>
          </select>

          <label>
            Fecha inicio
            <input
              type="datetime-local"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </label>

          <label>
            Fecha fin
            <input
              type="datetime-local"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
              className="w-full border p-2"
              min={formData.fecha_inicio}
            />
          </label>

          <textarea
            name="descripcion_empleado"
            value={formData.descripcion_empleado}
            onChange={handleChange}
            placeholder="Descripción para el equipo"
            className="w-full border p-2"
          />

          <textarea
            name="descripcion_publica"
            value={formData.descripcion_publica}
            onChange={handleChange}
            placeholder="Descripción pública"
            className="w-full border p-2"
          />

          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            placeholder="ID Cliente (opcional)"
            className="w-full border p-2"
          />

          <input
            type="text"
            name="inmueble"
            value={formData.inmueble}
            onChange={handleChange}
            placeholder="ID Inmueble (opcional)"
            className="w-full border p-2"
          />

          <input
            type="text"
            name="pedido"
            value={formData.pedido}
            onChange={handleChange}
            placeholder="ID Pedido (opcional)"
            className="w-full border p-2"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCalendarActivity;
