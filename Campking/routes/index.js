var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middlewareObj = require("../middleware");

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/",function(req,res){
    res.render("landing");
});

router.get("/register", function(req, res) {
    res.render("register");
});

router.post("/register", function(req,res){
   var newUser = new User(
   {
       username: req.body.username,
       firstName: req.body.firstName,
       lastName: req.body.lastName,
       email: req.body.email,
       avatar: req.body.avatar
       
   });
   if(req.body.adminCode === "secretcode123"){
       newUser.isAdmin = true;
   }
   User.register(newUser, req.body.password, function(err, user){
       if(err){
           console.log(err);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds");
       });
   }); 
});

router.get("/login", function(req, res) {
    res.render("login");
});

// app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds", 
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome to Yelcamp!"
    }), function(req, res) {
});

router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out Successfully!");
    res.redirect("/campgrounds");
});




// User profile
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something Went Wrong!");
            res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
            if(err){
            req.flash("error", "Something Went Wrong!");
            res.redirect("/");
        }
        res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
});


// Contact form routes//

router.get("/contact", function(req, res) {
    res.render("contact");
});

router.post("/contact", async (req, res) => {
    let { name,email,subject,message } = req.body;
    email = req.sanitize(email);
    subject = req.sanitize(subject);
    message = req.sanitize(message);
    name = req.sanitize(name);
    const msg = {
      to: 'shivamdamre913@gmail.com',
      from: 'shivamdamre913@gmail.com',
      subject: subject + ' from ' + name + '-' + email,
      text: message,
      html: message,
    };
    try {
        await sgMail.send(msg);
        req.flash("success", "Thank you for contacting us, we will come to you soon!");
        res.redirect("/contact");
      } catch (error) {
        console.error(error);
        if (error.response) {
          console.error(error.response.body);
        }
        req.flash("error", "Sorry something went Wrong!");
        res.redirect("back");
      }
});



module.exports = router;