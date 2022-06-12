var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  Password: String,
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true },
  avatar: { type: String, default: "https://i.imgur.com/O2vFdrv.jpg" },
  // artEntry: { type: mongoose.Schema.Types.ObjectId, ref: "ArtEntry" },
  judge: { type: Boolean, default: true },
  assignedCategories: [
    {
      name: String, //'Still Media Editorial'
      letter: String, //'B'
      type: String,
      subtype: String,
      specific: String,
    },
  ],
  judgingGroup: { type: String, default: "0" },
  // assignedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  isAdmin: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date,
  created: { type: Date, default: Date.now },
});


UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);
