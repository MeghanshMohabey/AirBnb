if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
//const mongoUrl = "mongodb://127.0.0.1:27017/Garrix";
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js")
// const { listingSchema, reviewSchema } = require("./Schema.js");
const session = require("express-session")
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user.js");
const dbUrl = process.env.ATLASDB_URL

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");  
const userRouter = require("./routes/user.js"); 



main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});
store.on("error" , () => {
    console.log("ERROR in MONGO SESSION STORE" , err)
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //7 days , 24 hrs, 60 mins 60 secs, 1000ms
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}



app.use(session(sessionOptions));
app.use(flash()); //These two lines should be written before middlewares

app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStratergy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.get("/demouser", async (req,res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "Maahi",
//     });
//    let registeredUser = await User.register(fakeUser,"helloWorld");
//     res.send(registeredUser);
// })

// app.get("/", (req,res) => {
//     res.send("The root is working!");
// })





// const validateListing = (req,res,next) => {
//     let { error } = listingSchema.validate(req.body);
    
//     if(error) {
//         let errMsg = error.details.map((el) => el.message).join(",")//extracting deatiled error
//         throw new ExpressError(400,errMsg)
//     } else {
//         next();
//     }
// }

// const validateReview = (req,res,next) => {
//     let { error } = reviewSchema.validate(req.body);
    
//     if(error) {
//         let errMsg = error.details.map((el) => el.message).join(",")//extracting deatiled error
//         throw new ExpressError(400,errMsg)
//     } else {
//         next();
//     }
// }

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter)

// //Index Route //commented these routes because the router functionality is in use...
// app.get("/listings", wrapAsync(async (req,res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", {allListings});
// }));

// //New Route
// app.get("/listings/new" , (req,res) => {
//     res.render("listings/new.ejs")
// })

// //Show Route
// app.get("/listings/:id", wrapAsync(async (req,res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id).populate("reviews"); //object print karna reviews ka
//     res.render("listings/show.ejs", { listing });
// }))

//Create Route
//handling error with try catch
// app.post("/listings", async (req, res,next) => {
//   try {
//     const newListing = new Listing(req.body.listing);
//     await newListing.save();
//   } catch (err) {
//     next(err)
//   }
// });

//handling error with wrapAsync function
// app.post("/listings",validateListing, wrapAsync(async (req, res,next) => {

//     let result = listingSchema.validate(req.body);
//     console.log(result);
//     if(result.error) {
//         throw new ExpressError(400,result.error)
//     }
//     const newListing = new Listing(req.body.listing);
//     await newListing.save();
//     res.redirect("/listings");
// }));

// //Edit route
// app.get("/listings/:id/edit", wrapAsync(async (req,res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", { listing} )
// }))

// //Update Route
// app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     // Extract listing object from body
//     let listing = req.body.listing; 
    
//     // Ensure image is handled as an object if your schema requires it
//     await Listing.findByIdAndUpdate(id, { ...listing });
    
//     res.redirect(`/listings/${id}`);
// }));
// //Delete Route
// app.delete("/listings/:id", wrapAsync(async (req,res) => {
//     let { id } = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
// }))

//Reviews Route
// //Post
// app.post("/listings/:id/reviews",validateReview, wrapAsync(async (req,res) => {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();


//     res.redirect(`/listings/${listing._id}`);
// }) )

// //Delete Review Route
// app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
//   const { id, reviewId } = req.params;

//   await Listing.findByIdAndUpdate(id, {
//     $pull: { reviews: reviewId }
//   });

//   await Review.findByIdAndDelete(reviewId);

//   res.redirect(`/listings/${id}`);
// }));


// app.get("/testlisting", async (req,res) => {
//     let sampleListing = new Listing({
//         title: "My new Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     res.send("successful testing")
// })

// app.use((err,req,res,next) => {  //used for try catch error handling
//     res.send("Something went wrong!");
// })

app.all(/.*/,(req,res,next) => { //used for all routes
    next(new ExpressError(404,"Page not found!"));
})

app.use((err,req,res,next) => {
    let { status=500, message="Something went wrong!" } = err;
    res.status(status).render("error.ejs",{message});
    //res.status(status).send(message);
})

app.listen(8080 , (req,res) => {
    console.log("Server is listening to 8080");
})