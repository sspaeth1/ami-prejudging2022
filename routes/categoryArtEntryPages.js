const express = require("express"),
  router = express.Router(),
  ArtEntry = require("../models/artEntry"),
  Category = require("../models/category");
  User = require("../models/user");
const { isLoggedIn } = require("../middleware");

// My Judging Categories

router.get("/categories/artentriesA1", isLoggedIn, function (req, res) {
  ArtEntry.find({}, function (err, artentries) {
    if (err) {
      console.log("Art Entries page: ", err.message);
    }
    res.render("categories/artentriesA1", { artentries: artentries });
  });
});

router.get("/categories/artentriesA2", isLoggedIn, function (req, res) {
  ArtEntry.find({}, function (err, artentries) {
    if (err) {
      console.log("Art Entries page: ", err.message);
    }
    res.render("categories/artentriesA2", { artentries: artentries });
  });
});

router.get("/categories/artentriesB", isLoggedIn, function (req, res) {
  ArtEntry.find({}, function (err, artentries) {
    if (err) {
      console.log("Art Entries page: ", err.message);
    }
    res.render("categories/artentriesB", { artentries: artentries });
  });
});

router.get("/categories/artentriesL", isLoggedIn, function (req, res) {
  ArtEntry.find({}, function (err, artentries) {
    if (err) {
      console.log("Art Entries page: ", err.message);
    }
    res.render("categories/artentriesL", { artentries: artentries });
  });
});

module.exports = router;
