const calculateBookingPrice = ({ pricePerNight, numberOfRooms, numberOfNights }) => {
  if (typeof pricePerNight !== "number" || pricePerNight <= 0) {
    throw new Error("Invalid room price per night.");
  }
  if (!numberOfRooms || numberOfRooms < 1) {
    throw new Error("Number of rooms must be at least 1.");
  }
  if (!numberOfNights || numberOfNights < 1) {
    throw new Error("Number of nights must be at least 1.");
  }

  const rawTotal = pricePerNight * numberOfRooms * numberOfNights;
  const totalAmount = Math.round(rawTotal * 100) / 100;

  return {
    pricePerNight,
    numberOfRooms,
    numberOfNights,
    totalAmount
  };
};

module.exports = {
  calculateBookingPrice
};

