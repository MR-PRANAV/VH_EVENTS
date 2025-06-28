const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  city: String,
  eventType: String,
  venueType: String,
  venueLocation: String,
  consultationDate: Date,
  requirements: String,
  heardFrom: String,
  adminNote: { type: String, default: "Pending" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // clientAgreement: { type: Boolean, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Booking', BookingSchema);