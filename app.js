require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();


// ***** EXPRESS CONFIGURATION *****
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());


// ***** DATABASE CONFIGURATION *****
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ***** REQUESTS *****

// Render home page
app.get("/", (req, res) => {
  res.render("home");
})

// Render login page
app.get("/login", (req, res) => {
  res.render("login");
})

// Render register page
app.get("/register", (req, res) => {
  res.render("register");
})

// Render secrets page
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})

// User logout
app.get("/logout", (req, res) => {
  req.logout((err)=>{
    if (err){
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
})


// Register new user
app.post("/register", (req, res) => {

  const usernameEntered = req.body.username;
  const passwordEntered = req.body.password;

  User.register({username: usernameEntered}, passwordEntered, (err, user)=>{
    if (err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  });

})

// User Login
app.post("/login", (req, res) => {

  const usernameEntered = req.body.username;
  const passwordEntered = req.body.password;

  const user = new User({
    username: usernameEntered,
    password: passwordEntered
  });

  req.login(user, (err)=>{
    if (err){
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  })
})



// ***** START SERVER *****
app.listen(3000, () => {
  console.log("Server started on port 3000");
})
