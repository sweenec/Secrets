require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-find-or-create');

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
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


// ***** GOOGLE AUTHENTICATION *****

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


// ***** FACEBOOK AUTHENTICATION *****

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// ***** REQUESTS *****

// Render home page
app.get("/", (req, res) => {
  res.render("home");
})


// Navigate to Google login
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);


// Authenticate with google
app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });


// Authenticate with Facebook
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });


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

  User.find({"secret": {$ne: null}}, (err, foundUsers)=>{
    if (err){
      console.log(err);
    } else {
      if (foundUsers){
        res.render("secrets", {usersWithSecrets:foundUsers});
      }
    }
  })
})

// Render Submit page
app.get("/submit", (req, res)=>{
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})

// User logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
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

  User.register({
    username: usernameEntered
  }, passwordEntered, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
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

  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  })
})

// Submit a secret
app.post("/submit", (req, res)=>{

  const submittedSecret = req.body.secret;

  User.findById(req.user.id, (err, foundUser)=>{
    if (err){
      console.log(err);
    } else {
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save((err)=>{
          if (!err){
            res.redirect("/secrets");
          }
        });
      }
    }
  })
})



// ***** START SERVER *****
app.listen(3000, () => {
  console.log("Server started on port 3000");
})
