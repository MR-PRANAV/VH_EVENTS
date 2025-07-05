const Booking = require("../models/Booking");
const newsletterRouter = require("../models/newsletter");
const ManagementProfile = require("../models/management");
const Media = require("../models/media");
const nodemailer = require("nodemailer");
const cloudinary = require('cloudinary').v2;

// Render admin dashboard
exports.renderAdminDashboard = (req, res) => {
  res.render('admin/admin.ejs');
};

// Render all bookings for admin
exports.renderAdminBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user')
      .sort({ createdAt: -1 });
    res.render('admin/admin_booking.ejs', { bookings });
  } catch (e) {
    req.flash('error', 'Error fetching bookings.');
    res.redirect('/admin');
  }
};

// Update admin note for a booking
exports.updateAdminNote = async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { adminNote: req.body.adminNote });
    res.redirect('/admin/bookings');
  } catch (e) {
    req.flash('error', 'Could not update admin note.');
    res.redirect('/admin/bookings');
  }
};

// Render newsletter emails page
exports.renderAdminNewsletters = async (req, res) => {
  try {
    const newsletters = await newsletterRouter.find({});
    res.render("admin/admin_newsletter.ejs", { newsletters });
  } catch (e) {
    req.flash("error", "Error to render newsletter emails form.");
    res.redirect("/admin");
  }
};

// Send newsletter emails
exports.sendNewsletterEmails = async (req, res) => {
  const { subject, message } = req.body;
  const newsletters = await newsletterRouter.find({});
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.VH_EVENTS_USER,
        pass: process.env.VH_EVENTS_PASS,
      },
    });
    for (const newsletter of newsletters) {
      const mailOptions = {
        from: `"VH Events Newsletter" <${process.env.VH_EVENTS_USER}>`,
        to: newsletter.email,
        subject: subject,
        text: message,
      };
      await transporter.sendMail(mailOptions);
    }
    req.flash("success", "Newsletter emails sent successfully!");
    res.redirect("/");
  } catch (e) {
    req.flash("error", "Error sending newsletter emails.");
    res.redirect("/admin/newsletters");
  }
};

// Render gallery upload page
exports.renderGalleryUpload = async (req, res) => {
  const media = await Media.find().sort({ uploadedAt: -1 });
  res.render('admin/admin_gallery_upload.ejs', { media });
};

// Handle gallery upload
exports.handleGalleryUpload = async (req, res) => {
  const file = req.file;
  if (!file) {
    req.flash('error', 'No file uploaded.');
    return res.redirect('/admin/gallery/upload');
  }
  const type = file.mimetype.startsWith('video') ? 'video' : 'image';
  await Media.create({ url: file.path, type });
  req.flash('success', 'Media uploaded!');
  res.redirect('/admin/gallery/upload');
};

// Delete gallery media
exports.deleteGalleryMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    const publicId = media.url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: media.type });
    await media.deleteOne();
  }
  res.redirect('/admin/gallery/upload');
};

// Star/unstar gallery media
exports.toggleStarGalleryMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    media.starred = !media.starred;
    await media.save();
  }
  res.redirect('/admin/gallery/upload');
};

// Render management profiles for admin
exports.renderAdminManagementProfiles = async (req, res) => {
  try {
    const managementProfiles = await ManagementProfile.find({})
      .populate('user', 'email')
      .sort({ createdAt: -1 });
    res.render("admin/admin_management_profiles.ejs", { managementProfiles });
  } catch (e) {
    req.flash("error", "Error fetching management profiles.");
    res.redirect("/admin");
  }
};