var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middlewareObj = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'yelcamp', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 


router.get("/", function(req,res){
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex},function(err,allCampgrounds){
            if(err){
                console.log(err);
            }else{
                if(allCampgrounds.length < 1){
                    noMatch = "No Campground found with the Name mentioned. Please try again!";
                }
                res.render("campgrounds/campgrounds",{campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });
    }else{
        //Get all campgrounds from DB
        Campground.find({},function(err,allCampgrounds){
            if(err){
                console.log(err);
            }else{
                res.render("campgrounds/campgrounds",{campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });
    }
    
});

//CREATE - add new campground to DB
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      };
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});


//New - show form to create new campground
router.get("/new",middlewareObj.isLoggedIn,function(req, res){
    res.render("campgrounds/new");
});     

router.get("/:id",function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        }else{
            console.log(foundCampground);
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
    
});

// Edit campground Route
router.get("/:id/edit", middlewareObj.checkCampOwner, function(req, res) {
        Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    req.flash("error", "Campground not found");
                    res.redirect("back");
                }else{
                    res.render("campgrounds/edit", {campground: foundCampground});
                }
            });
});

//Update campground Route
router.put("/:id", middlewareObj.checkCampOwner, upload.single('image'), function(req,res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.booking = req.body.campground.booking;
            campground.benifits = req.body.campground.benifits;
            campground.contact = req.body.campground.contact;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

//Delete route for campground//
router.delete('/:id', function(req, res) {
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.imageId);
        campground.remove();
        req.flash('success', 'Campground deleted successfully!');
        res.redirect('/campgrounds');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});






function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;