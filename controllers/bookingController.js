const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");

// Render booking page
exports.renderBookingPage = (req, res) => {
  res.render("booking/booking.ejs");
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const bookingData = { ...req.body, user: req.user._id };
    await Booking.create(bookingData);
    req.flash("success", "Your consultation has been booked! We will contact you soon.");
    res.redirect("/booking");
  } catch (e) {
    req.flash("error", "There was an error booking your consultation. Please try again.");
    res.redirect("/booking");
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    // Send cancellation email to admin
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.VH_EVENTS_USER,
        pass: process.env.VH_EVENTS_PASS,
      },
    });

    const mailOptions = {
      from: `"VH Events Booking System" <${process.env.VH_EVENTS_USER}>`,
      to: process.env.VH_EVENTS_USER,
      subject: `Booking Cancelled - VH Events`,
      text: `
    sender: ${booking.email}
    receiver: ${process.env.VH_EVENTS_USER}
    -------------------------------------------------------------
    -------------------------------------------------------------

🚫 A booking has been cancelled:
      booking ID: ${booking._id}
👤 Client Name: ${booking.fullName}
📧 Email: ${booking.email}
📞 Phone: ${booking.phone}

🎉 Event Type: ${booking.eventType}
🏛️ Venue Type: ${booking.venueType}
📍 Venue Location: ${booking.venueLocation}
📅 Consultation Date: ${booking.consultationDate ? booking.consultationDate.toDateString() : "Not specified"}

🗑️ Cancelled By: Client
      `,
      replyTo: booking.email,
    };

    await transporter.sendMail(mailOptions);

    // Delete booking from database
    await Booking.deleteOne({ _id: req.params.id });

    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/profile");
  } catch (e) {
    console.error("Cancellation failed:", e);
    req.flash("error", "There was an error cancelling your booking. Please try again.");
    res.redirect("/profile");
  }
};
