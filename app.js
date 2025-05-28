const express = require('express');
const bodyParser = require('body-parser');
const encrypt = require('mongoose-encryption');
const ejs = require("ejs");
const session = require("express-session");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(session({
  secret: "yourSecretKey", // Change this in production
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Mongoose setup
mongoose.connect("mongodb+srv://affaraffu:EMnXrteiNbuJJNHS@secrets.0h0mz0y.mongodb.net/?retryWrites=true&w=majority&appName=secrets");

const trySchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

const secretKey = "thisislittlesecret.";
trySchema.plugin(encrypt, { secret: secretKey, encryptedFields: ["password"] });

const User = mongoose.model("User", trySchema);

// Routes
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", async function (req, res) {
  try {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password
    });

    await newUser.save();

    // ✅ Set session after registration
    req.session.user = newUser;

    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
    res.send("Registration failed. Please try again.");
  }
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", async function (req, res) {
  const enteredEmail = req.body.username;
  const enteredPassword = req.body.password;

  try {
    const foundUser = await User.findOne({ email: enteredEmail });

    if (foundUser) {
      if (foundUser.password === enteredPassword) {
        // ✅ Set session after login
        req.session.user = foundUser;

        res.redirect("/secrets");
      } else {
        res.send("Incorrect password.");
      }
    } else {
      res.send("User not found.");
    }
  } catch (err) {
    console.log(err);
    res.send("Login failed. Please try again.");
  }
});

app.get("/secrets", async function (req, res) {
  try {
    const usersWithSecrets = await User.find({ secret: { $ne: null } });
    res.render("secrets", { usersWithSecrets: usersWithSecrets });
  } catch (err) {
    console.log(err);
    res.send("Error loading secrets.");
  }
});

app.get("/submit", function (req, res) {
  if (req.session.user) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async function (req, res) {
  if (req.session.user) {
    const submittedSecret = req.body.secret;

    try {
      const foundUser = await User.findById(req.session.user._id);
      if (foundUser) {
        foundUser.secret = submittedSecret;
        await foundUser.save();
        res.redirect("/secrets");
      } else {
        res.redirect("/login");
      }
    } catch (err) {
      console.error(err);
      res.redirect("/submit");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("Error logging out.");
    } else {
      res.redirect("/login");
    }
  });
});

// Start the server
app.listen(8000, function () {
  console.log("Server started on port 8000");
});
