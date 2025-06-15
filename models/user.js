const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false }
});

// Add the plugin
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

// Prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);