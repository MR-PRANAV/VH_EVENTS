const newsletterRouter = require("../models/newsletter");

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  const newsletterEmail = req.body.newsletteremail;
  try {
    const existingEmail = await newsletterRouter.findOne({ email: newsletterEmail });
    if (existingEmail) {
      req.flash("error", "You are already subscribed with this email ❗");
      return res.redirect("/");
    }
    const newsletter = new newsletterRouter({ email: newsletterEmail });
    await newsletter.save();
    req.flash("success", "You are subscribed to our newsletter ✅");
    res.redirect("/");
  } catch (err) {
    req.flash("error", "Error while subscribing to newsletter ❗");
    res.status(500).send("Error saving newsletter email.");
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const newsletter = await newsletterRouter.findByIdAndDelete(req.params.id);
    if (!newsletter) {
      req.flash("error", "Newsletter email not found ❗");
      return res.status(404).send("Newsletter email not found.");
    }
    req.flash("success", "Newsletter email unsubscribed successfully ✅");
    res.redirect("/admin/newsletters");
  } catch (err) {
    req.flash("error", "Error unsubscribing from newsletter ❗");
    res.status(500).send("Error unsubscribing from newsletter.");
  }
};