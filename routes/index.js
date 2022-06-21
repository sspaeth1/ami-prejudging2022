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


//==============
//RESTful routes
//==============

//INDEX route
router.get("/index", async (req, res) => {

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

router.get("/artentries", isLoggedIn, async function (req, res) {
  try {
    let pageCategoryId = req.query.categoryId;
    let complete;


    console.log('req.query: ' + JSON.stringify(req.query, null, 4), "\n", 'req.user.id: ' + JSON.stringify(req.user.id, null, 4));


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

        for (var i = 0; i < artentries.length; i++) {
          (function removeWhiteSpaceGetAlphaNum(){
            let  removeWhiteSpace=  artentries[i].title.replace(/\s/g, "");
                titleAlphaNumeric = removeWhiteSpace.split(" ", 1)[0];
            return titleAlphaNumeric;
          }())

          for (score of FindScoreIds){
            if(artentries[i].id == score.entryId && score.complete == true){
              artentries[i].star = true;
          }}

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
          pageCategoryId,
          categorySpecifics,
          JudgeGroups,
          letterIndexKeys,
          complete
        });
      });
  } catch (err) {
    console.log("go to artentries page catch err: ", err);
    res.redirect("/index");
  }
});

router.get("/artentries/:id", isLoggedIn, async (req, res) => {
  console.log('req.query: ' + JSON.stringify(req.query, null, 4), "\n", 'req.user.id: ' + JSON.stringify(req.user.id, null, 4));

  try {
    let pageCategoryId = Object.keys(req.query)[0]; //req.query.categoryId;
    console.log(` line 300 requested params id :  ${JSON.stringify(Object.keys(req.query)[0], null, 4)}`); //req.params
    let findScore;
     await GeneralScore.findOne({ entryId: req.params.id, judge: req.user.id },
      function(err,docs){
        if(err){
          console.log( 'line 302 err no entry with that user and entry', err)
        }
        else{
          if( docs == null){
            console.log("No existing score, creating new score");
              GeneralScore.create({
              entryId: req.params.id,
              judge: req.user.id,
              });
              // GeneralScore.findOne({}, { sort: { '_id' : -1 } }, function(err, newDocs) {
              //   if(err){
              //     console.log(err)
              //   }else{
              //     let judge = req.user.id;

              //     findScore = newDocs;
              //     console.log("post",  newDocs );
              //   }
              // }).limit(1);
              console.log('lin3 294');
          }
          let judge = req.user.id;
          console.log('line 311 found ', docs)
          findScore = docs
          console.log('lin3 299');
        }
        console.log('lin3 301');
       }
          )


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
    let titleAlphaNumeric
    (function removeWhiteSpaceGetAlphaNum(){
      let  removeWhiteSpace=  foundPage.title.replace(/\s/g, "");
         titleAlphaNumeric = removeWhiteSpace.split(" ", 1)[0];
      // console.log(titleAlphaNumeric);
      return titleAlphaNumeric;
    }())


    res.render("show", {
      categorySpecifics,
      letterIndexKeys,
      pageCategoryId,
      artentries: foundPage,
      score: findScore,
      id,
      notes,
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
    console.log("line 463ish, go to :id page catch err: " +  err)
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

    res.render("categories/showSample", { artentries: foundPage,JudgeGroups });
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
