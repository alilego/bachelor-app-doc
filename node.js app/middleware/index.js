var User            = require("../models/user");
var Article         = require("../models/article");

// all the middleare goes here
var middlewareObj = {};


middlewareObj.checkArticleOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Article.findById(req.params.id, function(err, foundArticle){
          if(err){
              req.flash("error", "Articolul nu e de gasit");
              res.redirect("back");
          }  else {
              // does user own the article or is admin?
            if(foundArticle.author.id.equals(req.user._id) || res.locals.currentUser.isAdmin) {
                next();
            } else {
                req.flash("error", "Articolele pot fi editate doar de autor sau de un administrator");
                res.redirect("back");
            }
          }
        });
    } else {
        req.flash("error", "Trebuie sa fii autentificat pentru aceasta actiune!");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Trebuie sa fii autentificat pentru aceasta actiune!");
    res.redirect("/login");
}

middlewareObj.isAdmin = function(req, res, next){
    if(req.isAuthenticated()){
        if(res.locals.currentUser.isAdmin){
            return next();    
        }
        req.flash("error", "Nu ai permisiuni pentru aceasta actiune!");
        res.redirect("/map");
    } else {
        req.flash("error", "Trebuie sa fii autentificat pentru aceasta actiune!");
        res.redirect("/login");
    }
}

middlewareObj.isContributor = function(req, res, next){
    if(req.isAuthenticated()){
        if(res.locals.currentUser.isContributor){
            return next();    
        }
        req.flash("error", "Nu ai permisiuni pentru aceasta actiune!");
        res.redirect("/map");
    } else {
        req.flash("error", "Trebuie sa fii autentificat pentru aceasta actiune!");
        res.redirect("/login");
    }
}

middlewareObj.isEditor = function(req, res, next){
    if(req.isAuthenticated()){
        if(res.locals.currentUser.isEditor){
            return next();    
        }
        req.flash("error", "Nu ai permisiuni pentru aceasta actiune!");
        res.redirect("/map");
    } else {
        req.flash("error", "Trebuie sa fii autentificat pentru aceasta actiune!");
        res.redirect("/login");
    }
}


module.exports = middlewareObj;