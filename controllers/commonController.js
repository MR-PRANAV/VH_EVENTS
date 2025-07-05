const Media = require("../models/media");
const ManagementProfile = require("../models/management");
const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");

exports.renderHome = async (req, res) => {
  const starredMedia = await Media.find({ starred: true }).sort({ uploadedAt: -1 });
  const managementProfiles = await ManagementProfile.find({ powerhouse: true }).populate('user', 'email').sort({ createdAt: -1 });
  const bestDepartmentsequence = [ 'Show Flow','Production', 'Shadow', 'Logistics', 'Hospitality', 'F&B', 'Ritual', 'Artist Coordination' ];
  managementProfiles.sort((a, b) => {
    const indexA = bestDepartmentsequence.indexOf(a.bestDepartment);
    const indexB = bestDepartmentsequence.indexOf(b.bestDepartment);
    return indexA - indexB;
  });
  res.render('home/home.ejs', { starredMedia, managementProfiles });
};

exports.renderServices = (req, res) => {
  res.render("service/service.ejs");
};

exports.renderContact = (req, res) => {
  res.render("contact/contact.ejs");
};

exports.handleContact = async (req, res) => {
  const { FirstName, Email, PhoneNumber, TextArea } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.VH_EVENTS_USER,
      pass: process.env.VH_EVENTS_PASS,
    },
  });
  const mailOptions = {
    from: `"VH Events Contact" <${process.env.VH_EVENTS_USER}>`,
    to: process.env.VH_EVENTS_USER,
    subject: `New Contact Form Submission from ${FirstName}`,
    text: `
    sender: ${Email}
    receiver: ${process.env.VH_EVENTS_USER}
    -------------------------------------------------------------
    -------------------------------------------------------------
📩 New Contact Form Message:

👤 Name: ${FirstName}
📧 Email: ${Email}
📞 Phone: ${PhoneNumber}

📝 Query:
${TextArea}
    `,
    replyTo: Email,
  };
  try {
    await transporter.sendMail(mailOptions);
    req.flash("success", "Your message has been sent successfully!");
    res.redirect("/contact");
  } catch (error) {
    console.error("Email sending error:", error);
    req.flash("error", "Error sending email ❗ PLEASE CONTACT US BY 9588626847 OR vh.eventplanner25@gmail.com");
    res.redirect("/contact");
  }
};

exports.renderProfile = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id });
  const managementProfile = await ManagementProfile.findOne({ user: req.user._id });
  res.render("profile/profile.ejs", { bookings, managementProfile });
};

exports.renderGallery = async (req, res) => {
  const media = await Media.find().sort({ uploadedAt: -1 });
  res.render('gallery/gallery.ejs', { media });
};

exports.renderAgreement = (req, res) => {
  res.render("agreement/agreement.ejs");
};