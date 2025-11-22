export function capitalizarPrimeraLetra(cadena) {
  if (!cadena) return cadena;
  return cadena[0].toUpperCase() + cadena.slice(1).toLowerCase();
}


export function formatearFecha(fechaISO) {
  if (!fechaISO) return ""; // Manejo de nulos

  const fecha = new Date(fechaISO);

  // Usamos 'es-ES' (o 'es-MX') para español
  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric', // "15"
    month: 'long',  // "enero" (texto completo)
    timeZone: 'UTC' // IMPORTANTE: Para que no te reste un día por tu zona horaria
  });
};

export function formatearFechaParaInput(fechaISO) {
  const dateObject = new Date(fechaISO);

  // C. Verificamos que sea una fecha válida antes de convertir
  if (!isNaN(dateObject.getTime())) {

    // D. Extraemos Año, Mes y Día (con padding '0' si es necesario)
  const year = dateObject.getUTCFullYear(); 
  const month = String(dateObject.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObject.getUTCDate()).padStart(2, '0');

    // E. Armamos el string "YYYY-MM-DD"
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }

  }