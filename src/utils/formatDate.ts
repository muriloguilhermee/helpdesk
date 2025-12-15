import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Garante que sempre trabalhamos com um objeto Date válido,
// mesmo que a aplicação envie string/number/null por engano.
const toDate = (value: Date | string | number | null | undefined): Date => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    // Tenta interpretar como ISO; se falhar, tenta com new Date
    try {
      const parsed = parseISO(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      // ignora, tenta fallback abaixo
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  if (typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  // Fallback: agora, para evitar RangeError no date-fns, usamos a data atual
  return new Date();
};

export const formatDate = (value: Date | string | number | null | undefined): string => {
  const date = toDate(value);
  return format(date, "dd/MM/yyyy 'às' HH:mm");
};

export const formatDateShort = (value: Date | string | number | null | undefined): string => {
  const date = toDate(value);
  return format(date, "dd/MM/yy HH:mm");
};

export const formatRelativeDate = (value: Date | string | number | null | undefined): string => {
  const date = toDate(value);
  return formatDistanceToNow(date, { addSuffix: true });
};

