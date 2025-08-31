import { format as dateFnsFormat } from 'date-fns';
import { es } from 'date-fns/locale';

export function safeFormat(date: any, formatStr: string = 'PP', options: any = { locale: es }): string {
  if (!date) return 'Sin fecha';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    return dateFnsFormat(dateObj, formatStr, options);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Fecha inválida';
  }
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  try {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}