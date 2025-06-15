const mongoose = require('mongoose');
const mediaSchema = new mongoose.Schema({
  url: String,
  type: { type: String, enum: ['image', 'video'] },
  uploadedAt: { type: Date, default: Date.now },
  starred: { type: Boolean, default: false } // <-- Add this
});
module.exports = mongoose.model('Media', mediaSchema);