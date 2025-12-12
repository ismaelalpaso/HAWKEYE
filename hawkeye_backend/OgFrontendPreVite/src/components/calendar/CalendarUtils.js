export const startHour = 6;
export const endHour = 24;
export const intervalMinutes = 15;

export const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/**
 * Dada una selección de día y filas, retorna:
 * {
 *   fecha: "YYYY-MM-DD",
 *   horaInicio: "HH:MM",
 *   horaFin: "HH:MM"
 * }
 */
export function getDateFromSelection(selection) {
  const today = new Date();
  let fechaObj;

  if (selection.day === "Hoy") {
    fechaObj = new Date();
  } else {
    const todayDay = (today.getDay() + 6) % 7; // Lunes = 0
    const targetDayIndex = days.indexOf(selection.day);
    let diffDays = targetDayIndex - todayDay;
    fechaObj = new Date();
    fechaObj.setDate(today.getDate() + diffDays);
  }

  fechaObj.setHours(0, 0, 0, 0);
  const fecha = fechaObj.toLocaleDateString('sv-SE'); // YYYY-MM-DD
  const horaInicio = calcularHoraDesdeFila(selection.start);
  const horaFin = calcularHoraDesdeFila(selection.end + 1);

  return { fecha, horaInicio, horaFin };
}

/**
 * Dado el índice de fila, devuelve "HH:MM"
 */
function calcularHoraDesdeFila(rowIndex) {
  const totalMinutes = startHour * 60 + rowIndex * intervalMinutes;
  const horas = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutos = (totalMinutes % 60).toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

/**
 * Retorna el estilo (top, left, height) para posicionar la actividad en vista semanal/diaria
 */
export function getStyleForActividad(actividad) {
  const start = new Date(actividad.fecha_inicio);
  const end = new Date(actividad.fecha_fin);
  const col = (start.getDay() + 6) % 7; // Lunes = 0
  const minutesSinceStart = (start.getHours() - startHour) * 60 + start.getMinutes();
  const top = (minutesSinceStart / intervalMinutes) * 20 + 64;
  const height = ((end - start) / 1000 / 60 / intervalMinutes) * 20;

  return {
    top,
    left: col * 160 + 160,
    height,
  };
}
