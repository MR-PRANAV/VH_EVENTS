const ManagementProfile = require("../models/management");
const cloudinary = require('cloudinary').v2;

// Render management form
exports.renderForm = (req, res) => {
  res.render("management/management.ejs");
};

// Create management profile
exports.createProfile = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'vh-events/management-profiles',
    });

    const {
      fullName, mobileNumber, email, age, gender, height, currentCity,
      otherCities, languages, otherLanguage, experienceYears, eventsWorked,
      eventCategories, companiesWorkedWith, departmentsWorked, bestDepartment,
      skills, workingStyle, instagram, agreeContact, confirmTruth
    } = req.body;

    const otherCitiesArr = otherCities ? otherCities.split(',').map(s => s.trim()) : [];
    const languagesArr = Array.isArray(languages) ? languages : (languages ? [languages] : []);
    const eventCategoriesArr = Array.isArray(eventCategories) ? eventCategories : (eventCategories ? [eventCategories] : []);
    const departmentsWorkedArr = Array.isArray(departmentsWorked) ? departmentsWorked : (departmentsWorked ? [departmentsWorked] : []);
    const skillsArr = Array.isArray(skills) ? skills : (skills ? [skills] : []);

    const profile = new ManagementProfile({
      user: req.user._id,
      profilePicture: result.secure_url,
      fullName,
      mobileNumber,
      email,
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
};

// Delete management profile
exports.deleteProfile = async (req, res) => {
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
};

// Update powerhouse status
exports.updatePowerhouse = async (req, res) => {
  const { id } = req.params;
  const { powerhouse } = req.body;
  await ManagementProfile.findByIdAndUpdate(id, { powerhouse: powerhouse === 'true' });
  req.flash('success', `Powerhouse status updated! ${powerhouse === 'true' ? 'Added to Powerhouse' : 'Removed from Powerhouse'}`);
  res.redirect('/admin/managementprofiles');
};

// Render edit form
exports.renderEditForm = async (req, res) => {
  try {
    const managementProfile = await ManagementProfile.findById(req.params.id);
    if (!managementProfile) {
      req.flash("error", "Management profile not found.");
      return res.redirect("/profile");
    }
    res.render("management/edit.ejs", { managementProfile });
  } catch (e) {
    console.error(e);
    req.flash("error", "Error fetching management profile for editing.");
    res.redirect("/profile");
  }
};

// Update management profile
exports.updateProfile = async (req, res) => {
  try {
    const managementProfile = await ManagementProfile.findById(req.params.id);
    if (!managementProfile) {
      req.flash("error", "Management profile not found.");
      return res.redirect("/profile");
    }

    let profilePictureUrl = managementProfile.profilePicture;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'vh-events/management-profiles',
      });
      profilePictureUrl = result.secure_url;
    }

    const otherCitiesArr = req.body.otherCities ? req.body.otherCities.split(',').map(s => s.trim()) : [];
    const languagesArr = Array.isArray(req.body.languages) ? req.body.languages : (req.body.languages ? [req.body.languages] : []);
    const eventCategoriesArr = Array.isArray(req.body.eventCategories) ? req.body.eventCategories : (req.body.eventCategories ? [req.body.eventCategories] : []);
    const departmentsWorkedArr = Array.isArray(req.body.departmentsWorked) ? req.body.departmentsWorked : (req.body.departmentsWorked ? [req.body.departmentsWorked] : []);
    const skillsArr = Array.isArray(req.body.skills) ? req.body.skills : (req.body.skills ? [req.body.skills] : []);

    Object.assign(managementProfile, {
      profilePicture: profilePictureUrl,
      fullName: req.body.fullName,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      age: req.body.age,
      gender: req.body.gender,
      height: req.body.height,
      currentCity: req.body.currentCity,
      otherCities: otherCitiesArr,
      languages: languagesArr,
      otherLanguage: req.body.otherLanguage,
      experienceYears: req.body.experienceYears,
      eventsWorked: req.body.eventsWorked,
      eventCategories: eventCategoriesArr,
      companiesWorkedWith: req.body.companiesWorkedWith,
      departmentsWorked: departmentsWorkedArr,
      bestDepartment: req.body.bestDepartment,
      skills: skillsArr,
      workingStyle: req.body.workingStyle,
      instagram: req.body.instagram,
      agreeContact: req.body.agreeContact === 'on' || req.body.agreeContact === true,
      confirmTruth: req.body.confirmTruth === 'on' || req.body.confirmTruth === true
    });

    await managementProfile.save();

    req.flash("success", "Management profile updated successfully!");
    res.redirect("/profile");
  } catch (e) {
    console.error(e);
    req.flash("error", "Error updating management profile.");
    res.redirect(`/management/${req.params.id}/edit`);
  }
};