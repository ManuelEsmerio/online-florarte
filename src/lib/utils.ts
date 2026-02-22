
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un rango de tiempo para la UI.
 * @param dbValue El valor de la base de datos (ej: "9-13").
 * @returns Una cadena formateada (ej: "09:00 AM - 01:00 PM").
 */
export function formatTimeSlotForUI(dbValue: string | null | undefined): string {
  if (!dbValue || !dbValue.includes('-')) return "No especificado";

  try {
    const [start, end] = dbValue.split("-").map(Number);

    if(isNaN(start) || isNaN(end)) return "No especificado";

    const toAmPm = (hour: number) => {
      const suffix = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${h12.toString().padStart(2, "0")}:00 ${suffix}`;
    };

    return `${toAmPm(start)} - ${toAmPm(end)}`;
  } catch (error) {
    console.error("Error formatting time slot:", error);
    return dbValue; // Devuelve el original si hay un error
  }
}

export function parseTimeSlotFromUI(uiValue: string | null | undefined): string {
  if (!uiValue || !uiValue.includes("-")) return "No especificado";

  try {
    const [startStr, endStr] = uiValue.split(" - ").map(s => s.trim());

    const to24Hour = (timeStr: string): number => {
      const [hourPart, suffix] = timeStr.split(" ");
      const [hour] = hourPart.split(":").map(Number);

      if (isNaN(hour)) throw new Error("Hora inválida");

      if (suffix === "AM") {
        return hour === 12 ? 0 : hour;
      } else if (suffix === "PM") {
        return hour === 12 ? 12 : hour + 12;
      } else {
        throw new Error("Formato AM/PM inválido");
      }
    };

    const start = to24Hour(startStr);
    const end = to24Hour(endStr);

    return `${start}-${end}`;
  } catch (error) {
    console.error("Error parsing time slot:", error);
    return "No especificado";
  }
}


/**
 * Parsea una cadena de fecha (YYYY-MM-DD) o un objeto Date a un objeto Date en UTC.
 * Esto evita problemas de zona horaria donde la fecha podría cambiar al día anterior/siguiente.
 * @param input La fecha de entrada, puede ser string, Date o null/undefined.
 * @returns Un objeto Date en UTC o null si la entrada es inválida.
 */
export function parseToUTCDate(input: unknown): Date | null {
  if (!input) return null;

  // Si ya es un objeto Date válido, no se necesita hacer nada.
  if (input instanceof Date && !isNaN(input.getTime())) {
    // Para asegurar consistencia, lo convertimos a UTC
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  };

  if (typeof input !== "string") return null;
  
  const s = input.trim();
  
  if (!s || s === "0000-00-00") return null;

  // Si es una fecha completa ISO (ej. 2025-08-31T00:00:00.000Z), la parseamos directamente.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Si es solo una fecha YYYY-MM-DD, la parseamos manualmente como UTC.
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [_, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return isNaN(date.getTime()) ? null : date;
}


/**
 * Formatea una fecha usando Intl.DateTimeFormat para un formato localizado, capitalizado y seguro.
 * Utiliza parseToUTCDate para evitar errores de zona horaria.
 * @param input La fecha de entrada (string, Date, o null).
 * @returns La fecha formateada como string (ej. "10 de Mayo de 2026") o una cadena vacía.
 */
export function formatDateIntl(input: unknown): string {
  const date = parseToUTCDate(input);
  if (!date) return "";

  let formattedDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // Importante: formatear en UTC
  }).format(date);
  
  // Capitalizar la primera letra del mes
  return formattedDate.replace(/(\b[a-z](?=[a-z]{2}))/g, (letter) => letter.toUpperCase());
}
