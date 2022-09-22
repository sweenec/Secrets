require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));


// ***** DATABASE *****
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = new mongoose.model("User", userSchema);


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


// Register new user
app.post("/register", (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {

    const newUser = new User({
      email: req.body.username,
      password: hash
    })

    newUser.save((err) => {
      if (!err) {
        res.render("secrets");
      } else {
        console.log(err);
      }
    })
  });
})

// User Login
app.post("/login", (req, res) => {

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({
    email: username
  }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, (err, result) => {
          if (result === true) {
            res.render("secrets");
          }
        })
      }
    }
  })
})



// ***** START SERVER *****
app.listen(3000, () => {
  console.log("Server started on port 3000");
})
