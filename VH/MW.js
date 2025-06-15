const Booking = require("./models/Booking");
const User = require("./models/User");
// Middleware to check if user is logged in

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You must be logged in!");
  res.redirect("/login");
}

// Authorization middleware to ensure user owns the booking

async function isBookingOwner(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/profile");
    }
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You are not authorized to modify this booking.");
      return res.redirect("/profile");
    }
    next();
  } catch (err) {
    req.flash("error", "Booking not found.");
    return res.redirect("/profile");
  }
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  req.flash("error", "You are not authorized to access this page.");
  res.redirect("/");
}

module.exports = { isLoggedIn, isBookingOwner, isAdmin };