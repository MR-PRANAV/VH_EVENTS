const mongoose = require('mongoose');

const ManagementProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the current user
  profilePicture: { type: String, required: true },
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: String },
  currentCity: { type: String, required: true },
  otherCities: [{ type: String }],
  languages: [{ type: String }],
  otherLanguage: { type: String },
  experienceYears: { type: Number, required: true },
  eventsWorked: { type: Number },
  eventCategories: [{ type: String }],
  companiesWorkedWith: { type: String },
  departmentsWorked: [{ type: String }],
  bestDepartment: { type: String },
  skills: [{ type: String }],
  workingStyle: { type: String },
  instagram: { type: String },
  agreeContact: { type: Boolean, required: true },
  confirmTruth: { type: Boolean, required: true },
  powerhouse: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ManagementProfile', ManagementProfileSchema);