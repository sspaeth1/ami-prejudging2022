const express = require("express"),
  router = express.Router(),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override"),
  User = require("../models/user"),
  ArtEntry = require("../models/artEntry");

//================
//New item route
//================
router.get("/artentries/new", function (req, res) {
  res.render("new");
});

//CREATE route
router.post("/artentries", function (req, res) {
  //create entry
  ArtEntry.create(req.body.artentries, function (err, newEntry) {
    if (err) {
      res.render("/new");
    }
    res.redirect("/artentries");
  });
});

module.exports = router;
