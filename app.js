const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/User");
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const ManagementProfile = require("./models/management"); 
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const { isLoggedIn, isBookingOwner, isAdmin } = require("./MW");

const newsletterRouter = require("./models/newsletter");
const Booking = require("./models/Booking");
const Media = require('./models/media');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary'); 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'vh_gallery',
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
  }),
});
const cloudinaryUpload = multer({ storage });

const app = express();
let port = 3030;

app.use(methodOverride("_method"));

// DB URL & CONECTION
const dbUrl = process.env.DB_URL;
main()
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
}
//---------------------


app.set("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionOption = {
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,
};
app.use(
  session({
    secret: "yourSecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost:27017/vh_events" }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } //COOKIE VALID FOR 7 DAYS for user login session
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});




// -----------------Commen--ROUTES--------------------------  -------
//get to render home page Start #base page
app.get("/", async (req, res) => {
  // stared media from the database
  const starredMedia = await Media.find({ starred: true }).sort({ uploadedAt: -1 });
  res.render('home/home.ejs', { starredMedia });
});
//get to render home page End

//get to render services page Start
app.get("/services", (req, res) => {
  res.render("service/service.ejs");
});
//get to render services page End

//get to render booking page Start
app.get("/booking", isLoggedIn, (req, res) => {
  res.render("booking/booking.ejs");
});
//get to render booking page End


//get to render contact page Start
app.get("/contact", (req, res) => {
  res.render("contact/contact.ejs");
});
//get to render contact page End


app.post("/contact", async (req, res) => {
  const { FirstName, Email, PhoneNumber, TextArea } = req.body;

  // Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.VH_EVENTS_USER,
      pass: process.env.VH_EVENTS_PASS,
    },
  });

  // email setup
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
});





//get to render PROFILE page Start
app.get("/profile", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id });
  // get management profile if exists
  const managementProfile = await ManagementProfile.findOne({ user: req.user._id });
  // console.log("Management Profile:",managementProfile.profilePicture);
  res.render("profile/profile.ejs", { bookings, managementProfile });
});
//get to render PROFILE page End

app.get('/gallery', async (req, res) => {
  const media = await Media.find().sort({ uploadedAt: -1 });
  res.render('gallery/gallery.ejs', { media });
});

//get to render management form page Start
app.get("/management", isLoggedIn, (req, res) => {
  res.render("management/management.ejs");
});
//get to render management form page End

// -------------------newsletter----------------------------------

//newsletter email saving Start
app.post("/newsletter", async (req, res) => {
  const newsletterEmail = req.body.newsletteremail;
  try {
    const existingEmail = await newsletterRouter.findOne({
      email: newsletterEmail,
    });

    if (existingEmail) {
      req.flash("error", "You are already subscribed with this email ❗");
      res.redirect("/");
      return;
    }
   
    // otherwise
    const newsletter = new newsletterRouter({
      email: newsletterEmail,
    });
    await newsletter.save();
    // console.log("Newsletter email saved:", newsletterEmail);
    req.flash("success", "You are subscribed to our newsletter ✅");
    res.redirect("/");
  } catch (err) {
    // console.error("Error saving newsletter email:", err);
    req.flash("error", "Error while subscribing to newsletter ❗");
    res.status(500).send("Error saving newsletter email.");
  }
});
// Newsletter email saving route End

// Delete newsletter email route Start
app.delete("/newsletter/:id", async (req, res) => {
  try {
    const newsletter = await newsletterRouter.findByIdAndDelete(req.params.id);
    if (!newsletter) {
      req.flash("error", "Newsletter email not found ❗");  
      return res.status(404).send("Newsletter email not found.");
    }
    req.flash("success", "Newsletter email unsubscribed successfully ✅");
    res.redirect("/admin/newsletters");
  } catch (err) {
    console.error("Error unsubscribing newsletter email:", err);
    req.flash("error", "Error unsubscribing from newsletter ❗");
    res.status(500).send("Error unsubscribing from newsletter.");
  }
});
// Delete newsletter email route End


// -------------------LOGIN - SIGNUP---------------------------------

//get to render login page Start
app.get("/login", (req, res) => {
  res.render("login/login.ejs");
});

//Register route
app.post("/register", async (req, res) => {
  const { email, password, confirm } = req.body;
  if (password !== confirm) {
    req.flash("error", "Passwords do not match");
    return res.redirect("/login");
  }
  try {
    let existingEmail = await newsletterRouter.findOne({ email });
    if (!existingEmail) {
      // If not subscribed, subscribe now
      const newsletter = new newsletterRouter({ email });
      await newsletter.save();
      req.flash("success", "You have been subscribed to our newsletter!");
    } else {
      req.flash("info", "You are already subscribed to our newsletter.");
    }

    const user = new User({ email });
    await User.register(user, password);
    req.login(user, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to VH Events! Registration successful.");
      res.redirect("/");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/login");
  }
});

// Login route
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back to VH Events!");
    res.redirect("/");
  }
);

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out!");
    res.redirect("/");
  });
});




// --------------------------booking---------------------------------
//post to save booking info Start
app.post("/booking", isLoggedIn, async (req, res) => {
  try {
    const bookingData = { ...req.body, user: req.user._id };
    const booking = await Booking.create(bookingData);

    console.log( "req.user.email - " , req.user.email);

    req.flash(
      "success",
      "Your consultation has been booked! We will contact you soon."
    );
    res.redirect("/booking");
  } catch (e) {
    req.flash(
      "error",
      "There was an error booking your consultation. Please try again."
    );
    res.redirect("/booking");
  }
});
//post to save booking info End


app.delete("/booking/:id", isLoggedIn, isBookingOwner, async (req, res) => {
  try {
    // Get booking info
    const booking = await Booking.findById(req.params.id);

    // Sending cancellati email to admin
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
    req.flash(
      "error",
      "There was an error cancelling your booking. Please try again."
    );
    res.redirect("/profile");
  }
});


// -------------------ADMIN---------------------------------


app.get("/admin", isLoggedIn, isAdmin, (req, res) => {
  res.render("admin/admin.ejs");
});

app.get("/admin/bookings", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .sort({ createdAt: -1 }); 
    res.render("admin/admin_booking.ejs", { bookings });
  } catch (e) {
    req.flash("error", "Error fetching bookings.");
    res.redirect("/admin");
  }
});

app.post("/admin/bookings/:id/note", isLoggedIn, isAdmin, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { adminNote: req.body.adminNote });
    res.redirect("/admin/bookings");
  } catch (e) {
    req.flash("error", "Could not update admin note.");
    res.redirect("/admin/bookings");
  }
});

app.get("/admin/newsletters", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const newsletters = await newsletterRouter.find({});
    res.render("admin/admin_newsletter.ejs" , { newsletters });
  } catch (e) {
    req.flash("error", "Error to render newsletter emails form.");
    res.redirect("/admin");
  }
});

app.post("/admin/newsletters", isLoggedIn, isAdmin, async (req, res) => {
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
});


app.get('/admin/gallery/upload', isLoggedIn, isAdmin, async (req, res) => {
  const media = await Media.find().sort({ uploadedAt: -1 });
  res.render('admin/admin_gallery_upload.ejs', { media });
});

app.post('/admin/gallery/upload', isLoggedIn, isAdmin, cloudinaryUpload.single('media'), async (req, res) => {
  const file = req.file;
  if (!file) {
    req.flash('error', 'No file uploaded.');
    return res.redirect('/admin/gallery/upload');
  }
  const type = file.mimetype.startsWith('video') ? 'video' : 'image';
  await Media.create({ url: file.path, type });
  req.flash('success', 'Media uploaded!');
  res.redirect('/admin/gallery/upload');
});

app.post('/admin/gallery/delete/:id', isLoggedIn, isAdmin, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    // remove from Cloudinary
    const publicId = media.url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: media.type });
    await media.deleteOne();
  }
  res.redirect('/admin/gallery/upload');
});

app.post('/admin/gallery/star/:id', isLoggedIn, isAdmin, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (media) {
    media.starred = !media.starred;
    await media.save();
  }
  res.redirect('/admin/gallery/upload');
});

app.get('/admin/managementprofiles', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const managementProfiles = await ManagementProfile.find({}).populate('user', 'email').sort({ createdAt: -1 });
    res.render("admin/admin_management_profiles.ejs", { managementProfiles });
  } catch (e) {
    req.flash("error", "Error fetching management profiles.");
    res.redirect("/admin");
  }
});

// -------------------MANAGEMENT---------------------------------

app.get("/management", isLoggedIn, async (req, res) => {
  try {
    res.render("management/management.ejs");
  } catch (e) {
    req.flash("error", "Error fetching management form.");
    res.redirect("/");
  }
});

app.post("/management", isLoggedIn, upload.single('profilePicture'), async (req, res) => {
  try {
    //upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'vh-events/management-profiles',
    });

    
    const {
      fullName, 
      mobileNumber, 
      age, 
      gender, 
      height, 
      currentCity,
      otherCities, 
      languages, 
      otherLanguage, 
      experienceYears, 
      eventsWorked,
      eventCategories, 
      companiesWorkedWith, 
      departmentsWorked, 
      bestDepartment,
      skills, 
      workingStyle, 
      instagram, 
      agreeContact, 
      confirmTruth
    } = req.body;

    
    const otherCitiesArr = otherCities ? otherCities.split(',').map(s => s.trim()) : [];
    const languagesArr = Array.isArray(languages) ? languages : (languages ? [languages] : []);
    const eventCategoriesArr = Array.isArray(eventCategories) ? eventCategories : (eventCategories ? [eventCategories] : []);
    const departmentsWorkedArr = Array.isArray(departmentsWorked) ? departmentsWorked : (departmentsWorked ? [departmentsWorked] : []);
    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

    // Create and save profile
    const profile = new ManagementProfile({
      user: req.user._id,
      profilePicture: result.secure_url,
      fullName,
      mobileNumber,
      age,
      gender,
      height,
      currentCity,
      otherCities: otherCitiesArr,
      languages: languagesArr,
      otherLanguage,
      experienceYears,
      eventsWorked,
      eventCategories: eventCategoriesArr,
      companiesWorkedWith,
      departmentsWorked: departmentsWorkedArr,
      bestDepartment,
      skills: skillsArr,
      workingStyle,
      instagram,
      agreeContact: agreeContact === 'on' || agreeContact === true,
      confirmTruth: confirmTruth === 'on' || confirmTruth === true
    });

    await profile.save();

    req.flash("success", "Management profile created successfully!");
    res.redirect("/profile");
  } catch (e) {
    console.error(e);
    req.flash("error", "Error creating management profile.");
    res.redirect("/management");
  }
});


app.delete("/management/:id", isLoggedIn, async (req, res) => {
  try {
    const profile = await ManagementProfile.findByIdAndDelete(req.params.id);
    if (!profile) {
      req.flash("error", "Management profile not found.");
      return res.redirect("/profile");
    }
    req.flash("success", "Management profile deleted successfully.");
    res.redirect("/profile"); 
  } catch (e) {
    console.error(e);
    req.flash("error", "Error deleting management profile.");
    res.redirect("/profile");
  }
});

app.post('/management/:id/powerhouse', isLoggedIn, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { powerhouse } = req.body;
  await ManagementProfile.findByIdAndUpdate(id, { powerhouse: powerhouse === 'true' });
  req.flash('success', 'Powerhouse status updated!');
  res.redirect('/admin/managementprofiles');
});

app.get("/agreement", (req, res) => {
  res.render("agreement/agreement.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------

