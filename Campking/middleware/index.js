var Campground = require("../models/campground.js");
var Comment = require("../models/comment.js");
var User = require("../models/user");


var middlewareObj = {};

middlewareObj.checkCampOwner = function(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground Not Found");
                res.redirect("back");
            }else{
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You do not have permission to do that!");
                    res.redirect("back");
                }
                
            }
    });
    }else{
        req.flash("error", "You need to be signed in to do that!");
        res.redirect("back");
    }
    
   
};

middlewareObj.checkCommentOwner = function(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Campground not found");
                res.redirect("back");
            }else{
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
                
            }
    });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
    
   
};


middlewareObj.checkProfileOwnership = function(req, res, next) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "Sorry, that user doesn't exist");
      res.redirect("/campgrounds");
    } else if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
      req.user = foundUser;
      next();
    } else {
      req.flash("error", "You don't have permission to do that!");
      res.redirect("/campgrounds/" + req.params.user_id);
    }
  });
};


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please log in!");
    res.redirect("/login");
};

module.exports = middlewareObj;