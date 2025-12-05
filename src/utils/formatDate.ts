import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy 'às' HH:mm");
};

export const formatDateShort = (date: Date): string => {
  return format(date, "dd/MM/yy HH:mm");
};

export const formatRelativeDate = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

