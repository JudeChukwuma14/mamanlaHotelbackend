const parseDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  // Standardize to UTC midnight
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const calculateNights = (checkIn, checkOut) => {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const isDateInPast = (date) => {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return date < todayUTC;
};

const isValidDateRange = (checkIn, checkOut) => {
  return checkOut.getTime() > checkIn.getTime();
};

module.exports = {
  parseDate,
  calculateNights,
  isDateInPast,
  isValidDateRange
};

