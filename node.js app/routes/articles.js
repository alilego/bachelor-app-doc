var express = require("express");
var router  = express.Router();
var Article = require("../models/article");
var middleware = require("../middleware");

//INDEX - list all articles
router.get("/", function(req, res){
  console.log("GET /articles");
  // Get all articles from DB; sort by creation date descending
  Article.find({}).sort({creationDate: -1}).exec(function(err, allArticles){
     if(err){
         console.log(err);
     } else {
        res.render("articles/list",{articles:allArticles});
     }
  });
});


//NEW - show form to create new article
router.get("/new", middleware.isEditor, function(req, res){
   res.render("articles/new"); 
});

//CREATE - add new article to DB
router.post("/", middleware.isEditor, function(req, res){
    // get data from form and add to articles array
    var title = req.body.title;
    var imageCover = req.body.imageCover;
    var description = req.body.description;
    var htmlContent = req.body.htmlContent;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newArticle = {  title: title, 
                        imageCover: imageCover, 
                        description: description, 
                        htmlContent: htmlContent, 
                        author:author  }
    // Create a new article and save to DB
    Article.create(newArticle, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to articles page
            console.log(newlyCreated);
            res.redirect("/articles");
        }
    });
});

// SHOW - display one article
router.get("/:id", function(req, res){
    //find the article with provided ID
    Article.findById(req.params.id, function(err, foundArticle){
        if(err){
            console.log(err);
        } else {
            //console.log(foundArticle)
            //render show template with that campground
            res.render("articles/view", {article: foundArticle});
        }
    });
});

// EDIT go to article edit page
router.get("/:id/edit", middleware.checkArticleOwnership, function(req, res){
    Article.findById(req.params.id, function(err, foundArticle){
        if(err){
            console.log(err);
        } else {
            //console.log(foundArticle)
            res.render("articles/edit", {article: foundArticle});
        }
    });
});

// UPDATE article data in DB
router.put("/:id",middleware.checkArticleOwnership, function(req, res){
    // find and update the correct campground
    Article.findByIdAndUpdate(req.params.id, req.body.article, function(err, updatedArticle){
      if(err){
          res.redirect("/articles");
      } else {
          //redirect somewhere(show page)
          console.log(updatedArticle);
          res.redirect("/articles/" + req.params.id);
      }
    });
});

module.exports = router;