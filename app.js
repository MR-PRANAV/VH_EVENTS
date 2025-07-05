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
const { isLoggedIn, isBookingOwner, isAdmin, canCreateManagementProfile } = require("./MW");

const bookingController = require('./controllers/bookingController');
const managementController = require('./controllers/managementController');
const adminController = require('./controllers/adminController');
const authController = require('./controllers/authController');
const newsletterController = require('./controllers/newsletterController');
const commonController = require('./controllers/commonController');


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




// -----------------Common--ROUTES---------------------------------
//get to render home page Start #Home/Base page
app.get("/", commonController.renderHome);
//get to render home page End

//get to render services page Start
app.get("/services", commonController.renderServices);
//get to render services page End

//get to render booking page Start
app.get("/booking", isLoggedIn, bookingController.renderBookingPage);
//get to render booking page End

//get to render contact page Start
app.get("/contact", commonController.renderContact);
//get to render contact page End

app.post("/contact", commonController.handleContact);

//get to render PROFILE page Start
app.get("/profile", isLoggedIn, commonController.renderProfile);
//get to render PROFILE page End

//get to render gallery page Start
app.get('/gallery', commonController.renderGallery);
//get to render gallery page End

//get to render management form page Start
app.get("/management", isLoggedIn, canCreateManagementProfile, (req, res) => {
  res.render("management/management.ejs");
});
//get to render management form page End

//get to render agreement page Start
app.get("/agreement", commonController.renderAgreement);
//get to render agreement page End

// -------------------newsletter----------------------------------
app.post("/newsletter", newsletterController.subscribe);
app.delete("/newsletter/:id", newsletterController.unsubscribe);

// -------------------LOGIN - SIGNUP---------------------------------
app.get("/login", authController.renderLogin);
app.post("/register", authController.register);
app.post("/login", authController.login);
app.get("/logout", authController.logout);

// --------------------------booking---------------------------------
app.get("/booking", isLoggedIn, bookingController.renderBookingPage);
app.post("/booking", isLoggedIn, bookingController.createBooking);
app.delete("/booking/:id", isLoggedIn, isBookingOwner, bookingController.deleteBooking);

// -------------------ADMIN---------------------------------
app.get('/admin', isLoggedIn, isAdmin, adminController.renderAdminDashboard);
app.get('/admin/bookings', isLoggedIn, isAdmin, adminController.renderAdminBookings);
app.post('/admin/bookings/:id/note', isLoggedIn, isAdmin, adminController.updateAdminNote);
app.get('/admin/newsletters', isLoggedIn, isAdmin, adminController.renderAdminNewsletters);
app.post('/admin/newsletters', isLoggedIn, isAdmin, adminController.sendNewsletterEmails);
app.get('/admin/gallery/upload', isLoggedIn, isAdmin, adminController.renderGalleryUpload);
app.post('/admin/gallery/upload', isLoggedIn, isAdmin, cloudinaryUpload.single('media'), adminController.handleGalleryUpload);
app.post('/admin/gallery/delete/:id', isLoggedIn, isAdmin, adminController.deleteGalleryMedia);
app.post('/admin/gallery/star/:id', isLoggedIn, isAdmin, adminController.toggleStarGalleryMedia);
app.get('/admin/managementprofiles', isLoggedIn, isAdmin, adminController.renderAdminManagementProfiles);

// -------------------MANAGEMENT---------------------------------
app.get("/management", isLoggedIn, canCreateManagementProfile, managementController.renderForm);
app.post("/management", isLoggedIn, canCreateManagementProfile, upload.single('profilePicture'), managementController.createProfile);
app.delete("/management/:id", isLoggedIn, managementController.deleteProfile);
app.post('/management/:id/powerhouse', isLoggedIn, isAdmin, managementController.updatePowerhouse);
app.get("/management/:id/edit", isLoggedIn, managementController.renderEditForm);
app.put("/management/:id", isLoggedIn, upload.single('profilePicture'), managementController.updateProfile);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------

