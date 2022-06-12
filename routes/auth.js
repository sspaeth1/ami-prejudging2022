const express = require("express"),
  router = express.Router(),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override"),
  mongoose = require("mongoose"),
  expressSanitizer = require("express-sanitizer"),
  User = require("../models/user"),
  ArtEntry = require("../models/artEntry"),
  async = require("async"),
  nodemailer = require("nodemailer"),
  Dotenv = require("dotenv"),
  crypto = require("crypto");
JudgeGroups = require("../public/json/Groups.js");
const { isLoggedIn } = require("../middleware");
const { render } = require("ejs");
Dotenv.config({ debug: process.env.DEBUG });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ===================
// Authenticate routes
// ===================

// show register form
router.get("/register", async (req, res) => {
  try {
    await res.render("register", { JudgeGroups });
  } catch (err) {
    console.log(err);
  }
});

//handle sign up logic

//Show register form
router.post("/register", async (req, res) => {
  try {
    await console.log(req.body);
    // req.body.password = req.sanitize(req.body.password);
    var user = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      avatar: req.body.avatar,
      judge: req.body.judge,
      judgingGroup: req.body.judgingGroup,
    });

    User.register(
      user,
      req.body.password,
      /* isLoggedIn , */ async (err, user) => {
        try {
          // await passport.authenticate("local", req, res, () => {
          //   req.flash("success", "Welcome " + user.username);
          //   res.redirect("/index");
          // });
          req.flash("success", "Welcome " + user.username);
          res.redirect("/index");
        } catch (err) {
          console.log("user not");
          console.log(err);
          req.flash("error", err);
          return res.render("register");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

router.get("/registerAdmin", async (req, res) => {
  try {
    await res.render("registerAdmin", { JudgeGroups });
  } catch (err) {
    console.log(err);
  }
});

// admin register POST
router.post("/registerAdmin", isLoggedIn, function (req, res) {
  try {
    var user = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      avatar: req.body.avatar,
      judge: req.body.judge,
      isAdmin: req.body.isAdmin,
      assignedCategories: req.body.assignedCategories,
    });
    if (req.body.isAdmin === true) {
      user.isAdmin = true;
    }

    User.register(user, req.body.password, function (err, user) {
      try {
        req.flash("success", "Welcome " + user.username);
        passport.authenticate("local", req, res, function () {
          return res.render("registerAdmin", { JudgeGroups });
        });
      } catch (err) {
        console.log(err);
        res.redirect("/index");
      }
    });
  } catch (err) {
    console.log(err);
  }
});

// forgot

router.get("/forgot", async (req, res) => {
  try {
    res.render("forgot", { JudgeGroups });
  } catch (err) {
    console.log(err);
  }
});

router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordTokenExpires = Date.now() + 36000000; // 1hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "shlomospaeth@gmail.com",
            pass: process.env.GMLPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "shlomospaeth@gmail.com",
          subject: "AMI Portal password reset",
          text:
            "You are receiving this because you have requested to reset your password" +
            "Please click on the following link or paste this into your browser to complete the process" +
            "http://" +
            req.header.host +
            "/reset/" +
            token +
            "\n\n" +
            "IF you did not request this, please ignore this email and your password will remain unchanged",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash("success", "An e-mail had been sent to" + user.email + " with further intructions.");
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset:token", function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordTokenExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot");
    }
    res.render("reset", { token: req.params.token });
  });
});

router.post("/reset:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordTokenExpires: { $gt: Date.now() } }, function (err, user) {
          if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("back");
          }
          if (req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function (err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordTokenExpires = undefined;

              user.save(function (err) {
                req.login(user, function (err) {
                  done(err, user);
                });
              });
            });
          } else {
            req.flash("error", "Password do not match.");
            return res.redirect("back");
          }
        });
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "shlomospaeth@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "shlomospaeth@gmail.com",
          subject: "Your Password has been changed",
          text: "Hello, \n\n" + "This is a confirmation that the password for your account " + user.email + " has just been changed",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password had been changed");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/artEntries");
    }
  );
});

//User Profiles

router.get("/profile/:id", isLoggedIn, (req, res) => {
  User.findById(req.params.id, function (err, foundProfile) {
    if (err) {
      req.flash("error", "Urp, issue with your profile");
      res.redirect("/login");
    }
    res.render("profiles/show", { user: foundProfile, JudgeGroups });
  });
});

//EDIT User
router.get("/profile/:id/edit", async (req, res) => {
  await User.findById(req.params.id, (err, foundProfile) => {
    try {
      res.render("editUser", { user: foundProfile, JudgeGroups });
    } catch (err) {
      console.log("redirect id edit");
      res.redirect("/artentries");
    }
  });
});

//Update user
router.put("/profile/:id/", async (req, res) => {
  // (id, new data, callback )
  User.findByIdAndUpdate(req.params.id, req.body.user, async (err, foundPage) => {
    try {
      for (const userId of req.body.users) {
        let user = await User.findById(userId);
        user.assignedCategories = req.body.categories;
        await user.save();
        res.redirect("/login/" + req.params.id);
      }
    } catch (err) {
      req.flash("error", "Urp, issue with your profile");
      console.log("error");
      res.render("/");
    }
  });
});

//Destroy user
router.delete("/profile/:id", (req, res) => {
  //destroy
  User.deleteOne(req.params.id, function (err) {
    if (err) {
      res.redirect("/login");
    }

    console.log("Deleted user");
    res.redirect("/login");
  });
});

//======
//LOGIN
//======
router.get("/login", async (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "index",
    failureFlash: "Login failed",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

router.get("/", function (req, res) {
  res.redirect("/index");
});

//Logout ROUTE

router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "Successfully logged out");
  res.redirect("/login");
});

//Get judges list:  ROUTE

router.get("/profiles/_judges", (req, res) => {
  User.find(req.params.id, function (err, foundUser) {
    if (err) {
      console.log("catch err: " + err.message);
      redirect("/index");
    }
    console.log(foundUser);
    res.render("profiles/_judges", { user: foundUser });
  });
});

module.exports = router;
