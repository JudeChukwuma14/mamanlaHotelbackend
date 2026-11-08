const crypto = require("crypto");

const generateBookingReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateSegment = `${year}${month}${day}`;

  const randomSegment = crypto
    .randomBytes(4)
    .toString("hex")
    .slice(0, 6)
    .toUpperCase();

  return `MLH-${dateSegment}-${randomSegment}`;
};

module.exports = {
  generateBookingReference
};

