var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");

router.delete("/campgrounds/:id", checkOwner, function(req,res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        }else{
            res.redirect("/campgrounds");
        }
    });
});

function checkOwner(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                res.redirect("back");
            }else{
                if(foundCampground.author.id.equals(req.user._id)){
                    next();
                }else{
                    res.redirect("back");
                }
                
            }
    });
    }else{
        res.redirect("back");
    }
    
   
}

module.exports = router;