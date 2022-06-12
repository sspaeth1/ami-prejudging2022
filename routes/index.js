const express = require("express"),
  router = express.Router(),
  passport = require("passport"),
  User = require("../models/user"),
  ArtEntry = require("../models/artEntry"),
  Category = require("../models/category"),
  GeneralScore = require("../models/score_general"),
  JudgeGroups = require("../public/json/Groups.js"),
  auth = require("../routes/auth"),
  categorySpecifics = require("../public/json/categorySpecifics.js"),
  letterIndexKeys = require("../public/json/LetterIndexKeys.json");
letterIndex = require("../public/json/LetterIndex");
Dotenv = require("dotenv");
const { isLoggedIn } = require("../middleware");
var fetch = require("isomorphic-fetch");
const { response } = require("express");
Dotenv.config({ debug: process.env.DEBUG });
const DBX_API_KEY = process.env.DBX_API_KEY;

const Dropbox = require("dropbox").Dropbox;

const config = {
  fetch: fetch,
  accessToken: DBX_API_KEY,
};
const dbx = new Dropbox(config);

//==============
//RESTful routes
//==============

//INDEX route
router.get("/index", async (req, res) => {

  /*
  //check if connected to DBX
  dbx.filesListFolder({
    path: '/C'
  }).then(res=>console.log(res)).catch(err=> console.log(err));
  */

  ArtEntry.find({}, function (err, artentries) {
    try {
      console.log(`index page loaded,  # of art entries: ${artentries.length}`);
      res.render("index", { artentries, categorySpecifics, JudgeGroups });
    } catch (err) {
      console.log("index page error: ", err.message);
    }
  }).populate("assignedCategories");
});

//===========
//SHOW Routes
//===========

router.get("/home", (req, res) => res.render("home"));

router.get("/generalGuidelines", (req, res) => res.render("generalGuidelines", { JudgeGroups, categorySpecifics }));

router.get("/guidelinesPrejudging", (req, res) => res.render("guidelinesPrejudging", { JudgeGroups, categorySpecifics }));

router.get("/judgingGroups", isLoggedIn, (req, res) => res.render("judgingGroups", { JudgeGroups, categorySpecifics }));

router.post("/judgingGroups", isLoggedIn, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  req.body.categories.forEach(function (letter) {
    let existsAlready = user.assignedCategories.find((category) => category.letter === letter);
    if (!existsAlready) {
      user.assignedCategories.push({
        name: categories[category],
        letter: letter,
      });
    }
  });
  await user.save();
  res.render("judgingGroups", { JudgeGroups });
});

//  award entry dropdown page

router.get("/awardWinners", isLoggedIn, async (req, res) => {
  let artentries = await ArtEntry.find({}).exec();
  let score = await GeneralScore.find({}).populate("judge").populate("score_general").exec();
  let exellenceWinnersDB = await ArtEntry.find({ excellenceWinner: true }, function (err, user) {
    if (err) {
      res.send(err);
    }
  });

  let meritWinnersDB = await ArtEntry.find({ meritWinner: true }, function (err, user) {
    if (err) {
      res.send(err);
    }
  });

  res.render("awardWinners", { score, artentries, categorySpecifics, letterIndex, JudgeGroups, exellenceWinnersDB, meritWinnersDB });
});

// await GeneralScore.find({}, (err, scores) => {
//   GeneralScore.aggregate([
//     { avg_Gnrl_part1_1_message: { $avg: "$gnrl_part1_1_message" } },
//   ]);

//   if (err) {
//     console.log(err.message);
//   }
//   res.render("awardWinnersFinal", { scores: scores });
// });

//Award Winners post

router.post("/awardWinners", async (req, res) => {
  try {
    let { category, excellenceWinner, excellenceEntryId, excellenceWinnerName, meritWinner, meritEntryId, meritWinnerName } = req.body;
    console.log("body", req.body, "\n", "-------------------------");

    console.log("excellenceWinner: ", excellenceWinner);
    console.log("meritWinner:", meritWinner);

    console.log("!!meritWinner:", meritWinner);

    if (excellenceWinner === "true") {
      await ArtEntry.findOneAndUpdate({ _id: excellenceEntryId }, { $set: { excellenceWinner: true, meritWinner: false } }).exec();
      console.log("excellenceWinner === true");
    } else if (excellenceWinner === "false") {
      console.log("excellenceWinner === false");
      await ArtEntry.findOneAndUpdate({ _id: excellenceEntryId }, { $set: { excellenceWinner: false } }).exec();
    } else if (meritWinner === "true") {
      console.log("meritWinner === true");
      await ArtEntry.findOneAndUpdate({ _id: meritEntryId }, { $set: { meritWinner: true, excellenceWinner: false } }).exec();
    } else if (meritWinner === "false") {
      console.log("meritWinner === false");
      await ArtEntry.findOneAndUpdate({ _id: meritEntryId }, { $set: { meritWinner: false } }, null, (err, meritWinner) => {
        console.log(meritWinner, ":", meritEntryId, " -update");
        res.redirect("/awardWinners");
      }).exec();
    }
  } catch (err) {
    console.log("update error: ", err.message);
    res.render("/");
  }
});

router.get("/appendixA", (req, res) => res.render("appendixA", { JudgeGroups }));

router.get("/appendixB", (req, res) => res.render("appendixB", { JudgeGroups }));

router.get("/ballots", (req, res) => res.render("ballots", { JudgeGroups }));

router.get("/judgingForms", (req, res) => res.render("judgingForms", { JudgeGroups }));

router.get("/artentries", async function (req, res) {// isLoggedIn, async function (req, res) {
  try {
    let pageCategoryId = req.query.categoryId;
    let complete;


    console.log('req.query: ' + JSON.stringify(req.query, null, 4));

    console.log(req.query.categoryId);

    let findScore = await GeneralScore.find({
      judge: req.user.id,
    }).exec();

    // var page = req.params.page || 1;
    // var r_limit = req.params.limit || 2;
    // var limit = parseInt(r_limit);

    await ArtEntry.find({ category: pageCategoryId })
      .populate("score_general")
      .exec()
      .then(async (artentries) => {
        let titleAlphaNumeric;
        let FindScoreIds = []

        findScore.forEach( score=>  FindScoreIds.push(score) );
        console.log("ooooooooooooooooo" + findScore);

        for (var i = 0; i < artentries.length; i++) {
          (function removeWhiteSpaceGetAlphaNum(){
            let  removeWhiteSpace=  artentries[i].title.replace(/\s/g, "");
                titleAlphaNumeric = removeWhiteSpace.split("_", 1)[0];
            return titleAlphaNumeric;
          }())

          let path = "/" + req.query.categoryId + "/" + titleAlphaNumeric;
          console.log("path: "  + path);
          let title = artentries[i].title;
          let categoryPath = "/" + req.query.categoryId + "/";


          let FindScoreId = FindScoreIds.filter(FindScoreId => {
            // FindScoreId.entryId === artentries[i].id
            console.log(">>>FindScore>>>>" + FindScoreId.entryId + "<<<<<<<<<<<<<<<<<<<" + "\n" +
                        ">>>artentries>>>" + artentries[i].id + "<<<<<<" + i + "<<<<<<<<<<<<<" + "\n")

          })

          let filePathImage = path + ".jpg";
          let filePathVideo = path + ".mp4";
          let a = artentries[i].category;
          if (path.split("-", 1)[0] + "/" === "/" + req.query.categoryId + "/" + req.query.categoryId + "/") {
            try {
              if (
                a === "A1" ||
                a === "A2" ||
                a === "B" ||
                a === "C" ||
                a === "D" ||
                a === "E" ||
                a === "H" ||
                a === "I1" ||
                a === "I2" ||
                a === "I3" ||
                a === "J" ||
                a === "K"
              ) {
                await dbx
                  .filesGetTemporaryLink({
                    path: filePathImage,
                  })
                  .then(function (response) {
                    artentries[i].link = response.link;
                    console.log(" link: ", response.link);
                    console.log(filePathImage);

                  });
              } else {
                await dbx
                  .filesGetTemporaryLink({
                    path: filePathVideo,
                  })
                  .then(function (response) {
                    console.log(filePathVideo);
                    artentries[i].link = response.link;
                    console.log(" link: ", response.link);
                  });
              }
            } catch (err) {
              artentries[i].link = "https://i.imgur.com/33E6CfN.jpg";
              console.log(" catch link: ", artentries[i].link);
              console.log("artentries[i] : " + filePathImage);
              console.log(" page catch err: ", err.error);
            }
          }
        }
        console.log(` ${artentries.length} # of art entries in this category `);
        res.render("artentries", {
          // title: "pagination",
          // result: result.docs,
          // total: result.total,
          // limit: result.limit,
          // page: page,
          // pages: result.pages,
          artentries,
          findScore,
          DBX_API_KEY,
          pageCategoryId,
          categorySpecifics,
          JudgeGroups,
          letterIndexKeys,
          complete
        });
      });

    //  await ArtEntry.find({},async function (err, artentries) {
    //     if (err) {
    //       console.log("Art Entries page: ", err.message);
    //     }
    //     for (var i = 0; i < artentries.length; i++) {
    //       if (artentries[i].folderId) {
    //        await dbx.usersGetCurrentAccount().then(function (response) {
    //           console.log("response", response);
    //         });
    //       }
    //     }
    //     res.render("artentries", {
    //       artentries,
    //       findScore,
    //       DBX_API_KEY,
    //       pageCategoryId,
    //       categorySpecifics,
    //       letterIndexKeys,
    //     });
    //   })
    //     .populate("judge")
    //     .populate("score_general")
    //     .exec((err, artEntryFound) => {
    //       if (err) {
    //         console.log("art etry populate: " + err.message);
    //       }
    //     });
  } catch (err) {
    console.log("go to artentries page catch err: ", err);
    res.redirect("/index");
  }
});

router.get("/artentries/:id", async (req, res) => { // isLoggedIn, async (req, res) => {
  try {
    let pageCategoryId = Object.keys(req.query)[0]; //req.query.categoryId;
    console.log(` requested params id :  ${JSON.stringify(Object.keys(req.query)[0], null, 4)}`); //req.params
    let findScore;

    if (!findScore) {
      console.log("No existing score, creating new score");
      await GeneralScore.create({
        entryId: req.params.id,
        judge: req.user.id,
      });
      console.log("user: ", req.user.id);
    }

    findScore = await GeneralScore.findOne({
      judge: req.user.id,
      entryId: req.params.id,
    })
      .populate("judge")
      .populate("entryId")
      .exec();

    let {
      judge: { judge },
      id,
      gnrl_part1_1_message = null,
      gnrl_part1_2_audience = null,
      gnrl_part1_3_problemSolving = null,
      gnrl_part1_4_accuracy = null,
      gnrl_part1_5_clarity = null,
      gnrl_part2_6_technique = null,
      gnrl_part2_7_composition = null,
      gnrl_part2_8_draftsmanship = null,
      gnrl_part2_9_craftsmanship = null,
      book_part1_1_message = null,
      book_part1_2_audience = null,
      book_part1_3_MedIlliUse = null,
      book_part1_4_accuracy = null,
      book_part1_5_clarity = null,
      book_part2_6_technique = null,
      book_part2_7_cmpstionDrftsmnshpCrftmnshp = null,
      book_part2_8_consistencyRendering = null,
      book_part2_9_layoutIntegration = null,
      anim_part1_1_message = null,
      anim_part1_2_audience = null,
      anim_part1_3_problemSolving = null,
      anim_part1_4_accuracy = null,
      anim_part1_5_clarity = null,
      anim_part2_6_technique = null,
      anim_part2_7_composition = null,
      anim_part2_8_draftsmanship = null,
      anim_part2_9_craftsmanship = null,
      anim_part2_10_motion_fx = null,
      anim_part2_11_sound = null,
      intractv_part1_1_message = null,
      intractv_part1_2_audience = null,
      intractv_part1_3_problemSolving = null,
      intractv_part1_4_intractvUse = null,
      intractv_part1_5_accuracy = null,
      intractv_part1_6_clarity = null,
      intractv_part2_7_technique = null,
      intractv_part2_8_UI = null,
      intractv_part2_9_draftsman_craftsmanship = null,
      intractv_part2_10_usability = null,
      intractv_part2_11_functionality = null,
      notes,
      complete,
    } = findScore;

    let foundPage = {};
    foundPage = await ArtEntry.findById(req.params.id);
    console.log("found page" + foundPage);
    let titleAlphaNumeric
    (function removeWhiteSpaceGetAlphaNum(){
      let  removeWhiteSpace=  foundPage.title.replace(/\s/g, "");
         titleAlphaNumeric = removeWhiteSpace.split("_", 1)[0];
      console.log(titleAlphaNumeric);
      return titleAlphaNumeric;
    }())

    let a = foundPage.category;
    let filePathImage = "/" + a + "/" +  titleAlphaNumeric + ".jpg";
    let filePathVideo = "/" + a + "/" +  titleAlphaNumeric + ".mp4";
    if (foundPage) {
      try {
        if (
          a === "A1" ||
          a === "A2" ||
          a === "B" ||
          a === "C" ||
          a === "D" ||
          a === "E" ||
          a === "H" ||
          a === "I1" ||
          a === "I2" ||
          a === "I3" ||
          a === "J" ||
          a === "K"
        ) {
          await dbx
            .filesGetTemporaryLink({
              path: filePathImage,
            })
            .then(function (response) {
              console.log("response line 393: " + response)
              mediaLink = response.link;
              console.log(" image link: ", response.link);
            });
        } else {
          await dbx
            .filesGetTemporaryLink({
              path: filePathVideo,
            })
            .then(function (response) {
              console.log(filePathVideo);
              mediaLink = response.link;
              console.log(" video link: ", response.link);
            });
        }
      } catch (err) {
        amediaLink = "https://i.imgur.com/33E6CfN.jpg";
        console.log(" catch link: ",  error.error_summary);
        console.log("response.link: " + response.link.response);
        // console.log(" page catch err: ", err.error);
      }
    }

    res.render("show", {
      categorySpecifics,
      letterIndexKeys,
      pageCategoryId,
      artentries: foundPage,
      score: findScore,
      DBX_API_KEY: DBX_API_KEY,
      id,
      notes,
      mediaLink,
      complete,
      JudgeGroups,
      gnrl_part1_1_message,
      gnrl_part1_2_audience,
      gnrl_part1_3_problemSolving,
      gnrl_part1_4_accuracy,
      gnrl_part1_5_clarity,
      gnrl_part2_6_technique,
      gnrl_part2_7_composition,
      gnrl_part2_8_draftsmanship,
      gnrl_part2_9_craftsmanship,
      book_part1_1_message,
      book_part1_2_audience,
      book_part1_3_MedIlliUse,
      book_part1_4_accuracy,
      book_part1_5_clarity,
      book_part2_6_technique,
      book_part2_7_cmpstionDrftsmnshpCrftmnshp,
      book_part2_8_consistencyRendering,
      book_part2_9_layoutIntegration,
      anim_part1_1_message,
      anim_part1_2_audience,
      anim_part1_3_problemSolving,
      anim_part1_4_accuracy,
      anim_part1_5_clarity,
      anim_part2_6_technique,
      anim_part2_7_composition,
      anim_part2_8_draftsmanship,
      anim_part2_9_craftsmanship,
      anim_part2_10_motion_fx,
      anim_part2_11_sound,
      intractv_part1_1_message,
      intractv_part1_2_audience,
      intractv_part1_3_problemSolving,
      intractv_part1_4_intractvUse,
      intractv_part1_5_accuracy,
      intractv_part1_6_clarity,
      intractv_part2_7_technique,
      intractv_part2_8_UI,
      intractv_part2_9_draftsman_craftsmanship,
      intractv_part2_10_usability,
      intractv_part2_11_functionality,
    });

    if (complete) {
      req.flash("success", "Marked as completed");
    }
  } catch (err) {
    console.log("go to :id page catch err: " +  err + err.message);
   // res.redirect("/artentries");
  }
});

//Sample entry
router.get("/SampleEntry", function (req, res) {
  ArtEntry.findById(req.params.id, function (err, foundPage) {
    if (err) {
      console.log("redirect id edit");
      res.redirect("index");
    }

    res.render("categories/showSample", { artentries: foundPage, DBX_API_KEY, JudgeGroups });
  });
});

//EDIT ROUTE
router.get("/artentries/:id/edit", async (req, res) => {
  await ArtEntry.findById(req.params.id, function (err, foundPage) {
    try {
      res.render("edit", { artentries: foundPage, JudgeGroups });
    } catch (err) {
      console.log("redirect id edit");
      res.redirect("/artentries");
    }
  });
});

//Update route
router.put("/artentries/:id", function (req, res) {
  // (id, new data, callback )
  ArtEntry.findByIdAndUpdate(req.params.id, req.body.artentries, function (err, foundPage) {
    if (err) {
      console.log("update error: ", err.message);
      res.render("/");
    }

    res.redirect("/artentries/" + req.params.id);
  });
});

//Destroy route
router.delete("/artentries/:id", function (req, res) {
  //destroy
  ArtEntry.deleteOne(req.params.id, function (err) {
    if (err) {
      res.redirect("/artentries");
    }

    console.log("Deleted entry");
    res.redirect("/artentries");
  });
});

module.exports = router;
