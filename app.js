var express=require("express");
var app= express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var methodOverride=require("method-override");
var User=require("./models/user");
var passport=require("passport");
var LocalStrategy= require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var Campground =require("./models/campground.js");
var Comment=require("./models/comment.js");
var seedDB=require("./seed.js");
var flash=require("connect-flash");




mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/yelp_camp");



var app= express();


app.set("view engine","ejs");

app.use(flash());
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
    secret: "Rusty is the most beautiful dog in the world",
    resave: false,
    saveUninitialized :false
}))
app.use(passport.initialize());
app.use(passport.session());



//Passing the Current User and passing flash messages


app.use(function(req,res,next){
    res.locals.CurrentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
})


//passport initialization


passport.use(User.createStrategy());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//seedDB();



//   HOME ROUTES


app.get("/",function(req,res){
    res.render("landings");
})





//campgrounds routes

app.get("/campgrounds",function(req,res){
    Campground.find({},function(err,campgrounds){
        if(err){
            console.log(err);
        }else{
            res.render("campground/campgrounds",{campgrounds:campgrounds});
        }
     })

    
})





app.post("/campgrounds",isloggedIn,function(req,res){
     var Name=req.body.Name;
     var Image=req.body.Image;
     var description=req.body.description;
     var price =req.body.price;
     var author={
         id:req.user._id,
         username: req.user.username
     }
    var newCampground={
        name: Name,
        image: Image,
        author: author,
        description: description,
        price: price

    }
    console.log(price);

     Campground.create(newCampground,function(err,campground){
         if(err){
           console.log(err);
       }else{
           console.log(campground);
           req.flash("Created new Campground");
        res.redirect("/campgrounds");
       }
   })
     
     
})






//ADD NEW CAMPGROUND ROUTE


app.get("/campgrounds/new", isloggedIn ,function(req,res){
    res.render("campground/new");
})




//campground show routes

app.get("/campgrounds/:id",function(req,res){
    var id= req.params.id;
    Campground.findById(id).populate("comments").exec(function(err,foundCampground){
       if(err){
           console.log(err);
       }else{
           res.render("campground/show",{campground:foundCampground})
       }
    })

})






// UPDATE CAMPGROUND ROUTE

app.get("/campgrounds/:id/edit",isCorrectUser,function(req,res){
    Campground.findById(req.params.id,function(err,found){

    res.render("campground/edit",{campground : found})
    })

})




app.put("/campgrounds/:id",isCorrectUser,function(req,res){
    Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updated){
        if(err){
            res.redirect("/campgrounds");
        }else{
            req.flash("success","Updated Campground successfully");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})






// CAMPGROUND DELETE ROUTE

app.delete("/campgrounds/:id",isCorrectUser,function(req,res){
    Campground.findByIdAndDelete(req.params.id,function(err){
        if(err){
            res.redirect("/campgrounds");

        }else{
            req.flash("success","Deleted campground successfully");
            res.redirect("/campgrounds");
        }
    })
})





//ADDING NEW COMMENT ROUTE


app.get("/campgrounds/:id/comments/new",isloggedIn,function(req,res){
     Campground.findById(req.params.id,function(err,found){
         if(err){
             console.log(err);
         }else{
            res.render("comments/new",{campground:found});
         }
     })
     

})




app.post("/campgrounds/:id/comments",isloggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,updated){
        if(err){
            console.log(err);

        }else{
        Comment.create(req.body.Comment,function(err,comment){
            if(err){
                console.log(err);
            }else{
                comment.author.id=req.user._id;
                comment.author.username=req.user.username;
                comment.save();

                updated.comments.push(comment);
                updated.save();
                req.flash("success","Created comment successfully");
                res.redirect("/campgrounds/" + updated._id);
            }
        })
        }
    })

})






//UPADTING NEW COMMENT

app.get("/campgrounds/:id/comments/:comment_id/edit",function(req,res){
    var campground_id =req.params.id;
    Comment.findById(req.params.comment_id,function(err,foundcomment){
        if(err){
            console.log(err);
        }else{
            res.render("comments/edit",{campground_id:campground_id,comment:foundcomment});
        }
    })
    
})




app.put("/campgrounds/:id/comments/:comment_id",isCorrectUserforComment,function(req,res){
    
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updated){
        if(err){
            res.redirect("/back");
        }else{
            req.flash("success","Updated Comment successfully")
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})


// deleting comment route



app.delete("/campgrounds/:id/comments/:comment_id",isCorrectUserforComment,function(req,res){
    Comment.findByIdAndDelete(req.params.comment_id,function(err){
        if(err){
            res.redirect("back");

        }else{
            req.flash("success","Deleted comment successfully!")
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})








 //Authentication routes

 //register routes

 app.get("/register",function(req,res){
     res.render("signup");
 })
 app.post("/register",function(req,res){
    var newUser=new User({username: req.body.username});
    console.log(newUser);
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/register");
        }else{
                passport.authenticate("local")(req,res,function(){
                req.flash("success", "Welcome to the Campground " + user.username)
                res.redirect("/campgrounds");
            })
        }
    })
})

//login routes

app.get("/login",function(req,res){
    
    res.render("login");
})

app.post("/login", passport.authenticate("local",{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}) ,function(req,res,){
    

});

//logout routes

app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","logged you out!!!");
    res.redirect("/campgrounds");
})

//checking (Function) whether the user is loggedIn

function isloggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }else
    {   req.flash("error","You need to be Login first!!!")
        res.redirect("/login");
    }
   
}



//AUTHORIZATION ROUTES

function isCorrectUser(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id,function(err,found){
            if(err){
                res.redirect("back");
            }else{
               
               if(found.author.id.equals(req.user._id))
                {
                      next()
                }else{
                    req.flash("error","you do not have the permission to do that")
                    res.redirect("back")
                }
                
            }
        })
    }else{
        req.flash("error","you need to be login first")
        res.redirect("/campgrounds");
    }
    
}










function isCorrectUserforComment(req,res,next){
    if(req.isAuthenticated())
    Comment.findById(req.params.comment_id,function(err,foundComment){
        if(err){
            res.redirect("back");
        }else{
            console.log(req.params.comment_id);
            console.log(foundComment.author.id);
            console.log(req.user._id);
           
           if(foundComment.author.id.equals(req.user._id))
            {
                  next()
            }else{
                req.flash("error","you do not have the permission to do that");
                res.redirect("back");
            }
            
        }
    })
}












// The Server Route:


app.listen("3000",function(){
    console.log("The server has started");
})