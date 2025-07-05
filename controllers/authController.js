const User = require("../models/User");
const newsletterRouter = require("../models/newsletter");
const passport = require("passport");

// Render login page
exports.renderLogin = (req, res) => {
  res.render("login/login.ejs");
};

// Register user
exports.register = async (req, res, next) => {
  const { email, password, confirm } = req.body;
  if (password !== confirm) {
    req.flash("error", "Passwords do not match");
    return res.redirect("/login");
  }
  try {
    let existingEmail = await newsletterRouter.findOne({ email });
    if (!existingEmail) {
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
};

// Login user
exports.login = [
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back to VH Events!");
    res.redirect("/");
  }
];

// Logout user
exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out!");
    res.redirect("/");
  });
};