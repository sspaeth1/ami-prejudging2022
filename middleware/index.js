module.exports = {
  isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error", "You need to be signed in for that");
    res.redirect("/login");
  },
};
