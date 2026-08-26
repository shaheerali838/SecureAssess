export const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

export const isExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};
