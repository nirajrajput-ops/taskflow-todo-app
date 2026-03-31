export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (timeString: string | null): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString: string | null, timeString: string | null): string => {
  if (!dateString) return 'No due date';
  const datePart = formatDate(dateString);
  const timePart = timeString ? ` at ${formatTime(timeString)}` : '';
  return datePart + timePart;
};

export const isOverdue = (dueDate: string | null, dueTime: string | null, status: string): boolean => {
  if (!dueDate || status === 'completed') return false;

  const now = new Date();
  const due = new Date(dueDate);

  if (dueTime) {
    const [hours, minutes] = dueTime.split(':');
    due.setHours(parseInt(hours), parseInt(minutes));
  } else {
    due.setHours(23, 59, 59);
  }

  return now > due;
};

export const isDueToday = (dueDate: string | null): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
};

export const isDueTomorrow = (dueDate: string | null): boolean => {
  if (!dueDate) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const due = new Date(dueDate);
  return (
    tomorrow.getFullYear() === due.getFullYear() &&
    tomorrow.getMonth() === due.getMonth() &&
    tomorrow.getDate() === due.getDate()
  );
};

export const getRelativeDueDate = (dueDate: string | null, dueTime: string | null, status: string): string => {
  if (!dueDate) return '';

  if (isOverdue(dueDate, dueTime, status)) {
    return 'Overdue';
  }

  if (isDueToday(dueDate)) {
    return dueTime ? `Today at ${formatTime(dueTime)}` : 'Today';
  }

  if (isDueTomorrow(dueDate)) {
    return dueTime ? `Tomorrow at ${formatTime(dueTime)}` : 'Tomorrow';
  }

  return formatDateTime(dueDate, dueTime);
};

export const shouldTriggerReminder = (
  dueDate: string | null,
  dueTime: string | null,
  reminder: string,
  reminderTriggered: boolean
): boolean => {
  if (!dueDate || reminder === 'none' || reminderTriggered) return false;

  const now = new Date();
  const due = new Date(dueDate);

  if (dueTime) {
    const [hours, minutes] = dueTime.split(':');
    due.setHours(parseInt(hours), parseInt(minutes));
  } else {
    due.setHours(9, 0, 0); // Default to 9 AM if no time set
  }

  const diffMs = due.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  switch (reminder) {
    case '15min':
      return diffMinutes <= 15 && diffMinutes > 0;
    case '1hour':
      return diffMinutes <= 60 && diffMinutes > 0;
    case '1day':
      return diffMinutes <= 24 * 60 && diffMinutes > 0;
    default:
      return false;
  }
};

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const computeNextRecurrenceDate = (
  currentDueDate: string,
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom',
  interval: number
): string => {
  const date = new Date(currentDueDate);
  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7 * interval);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'custom':
      date.setDate(date.getDate() + interval);
      break;
  }
  return date.toISOString().split('T')[0];
};
