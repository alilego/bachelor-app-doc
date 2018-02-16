var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var middleware = require("../middleware");

// Edit user personal info
router.get("/profile", middleware.isLoggedIn, function(req, res){
    console.log("USER GET");
    console.log(req.user);
    res.render("user/update", {user: req.user});
});

// Update user personal info
router.put("/profile", middleware.isLoggedIn, function(req, res){
    // find and update the user profile data
    console.log("UPDATE USER PERSONAL DATA");
    console.log(req.user);
    console.log("WITH:");
    // req.body.user.isContributor = true;
    // req.body.user.isEditor = true;
    // req.body.user.isApprover = true;
    // req.body.user.isAdmin = true;
    console.log(req.body.user);
    User.findByIdAndUpdate(req.user.id, req.body.user, function(err, updatedUser){
      if(err){
          req.flash("error", err.message);
      } else {
          req.flash("success", "Datele tale personale au fost actualizate.");
      }
      res.redirect("/map");
    });
});

// Edit user preferences
router.get("/preferences", middleware.isLoggedIn, function(req, res){
    console.log("USER GET");
    console.log(req.user);
    res.render("user/preferences", {user: req.user});
});

// Update user preferences
router.put("/preferences", middleware.isLoggedIn, function(req, res){
    // find and update the user preferences
    console.log("UPDATE USER PERSONAL DATA");
    console.log(req.user);
    console.log("WITH:");
    if(!req.body.user){
        req.body.user = {};
    }
    if(!req.body.user.alwaysCenterCity){
        req.body.user.alwaysCenterCity = false;
    }
    if(!req.body.user.dataEconomy){
        req.body.user.dataEconomy = false;
    }
    console.log(req.body.user);
    User.findByIdAndUpdate(req.user.id, req.body.user, function(err, updatedUser){
      if(err){
          req.flash("error", err.message);
      } else {
          req.flash("success", "Preferintele tale au fost actualizate.");
      }
      res.redirect("/map");
    });
});

//MANAGE USER PERMISSIONS
//show admin form
router.get("/admin", middleware.isAdmin, function(req, res){
   res.render("user/admin"); 
});

// Update admin rights for user
router.put("/admin", middleware.isAdmin, function(req, res){
    // find and update the requested user
    console.log("ADMIN: UPDATE USER PERMISSIONS");
    console.log(req.body.user.username);
    console.log("WITH:");
    if(!req.body.user){
        req.body.user = {};
    }
    if(!req.body.user.isContributor){
        req.body.user.isContributor = false;
    }
    if(!req.body.user.isEditor){
        req.body.user.isEditor = false;
    }
    if(!req.body.user.isApprover){
        req.body.user.isApprover = false;
    }
    if(!req.body.user.isAdmin){
        req.body.user.isAdmin = false;
    }
    console.log(req.body.user);
    User.findOne({username: req.body.user.username}, function(err, updatedUser){
        if(err || !updatedUser){
            if(err && err.message)
                console.log(err.message);
            req.flash("error", "Utilizatorul '" + req.body.user.username + "' nu a fost gasit");
            res.redirect("/user/admin"); 
        } else {
            updatedUser.isContributor = req.body.user.isContributor;
            updatedUser.isEditor = req.body.user.isEditor;
            updatedUser.isApprover = req.body.user.isApprover;
            updatedUser.isAdmin = req.body.user.isAdmin;
            
            updatedUser.save(function (err, user) {
                if(err) {
                    console.error(err.message);
                    req.flash("error", "Utilizatorul '" + req.body.user.username + "' nu a putut fi modificat");
                } else {
                    req.flash("success", "Drepturile utilizatorului '" + req.body.user.username +  "' au fost actualizate.");
                }
                res.redirect("/map");
            });
        }
    });
});

//search & return user
// router.get("/admin/search", middleware.isAdmin, function(req, res){
//     console.log("ADMIN USER SEARCH");
//     var searchedUserRegExp = '/'+req.query.searchedUser+'/';
//     console.log(searchedUserRegExp);
//     User.find({'username': new RegExp(searchedUserRegExp, "i")}, function(err, foundUsers){
//             if(err){
//                 console.log(err);
//                 req.flash("error", err.message);
//             } else {
//                 //redirect back to campgrounds page
//                 console.log(foundUsers);
//                 res.render("user/search_users", {searchedUsers:foundUsers});
//             }
//         });
//     res.render("user/admin"); 
// });

module.exports = router;