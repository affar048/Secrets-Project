const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb+srv://affaraffu:EMnXrteiNbuJJNHS@secrets.0h0mz0y.mongodb.net/?retryWrites=true&w=majority&appName=secrets");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  secret: String
});

const User = mongoose.model("User", userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));

// Routes

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register", { error: "" });
});

app.post("/register", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email }, (err, user) => {
    if (user) return res.render("register", { error: "Email already exists." });

    bcrypt.hash(password, 10, (err, hash) => {
      const newUser = new User({ name, email, passwordHash: hash });
      newUser.save(() => {
        res.redirect("/login");
      });
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login", { error: "" });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email }, (err, user) => {
    if (!user) return res.render("login", { error: "User not found." });

    bcrypt.compare(password, user.passwordHash, (err, match) => {
      if (!match) return res.render("login", { error: "Wrong password." });

      req.session.userId = user._id;
      res.redirect("/secrets");
    });
  });
});

app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } }, (err, users) => {
    res.render("secrets", { usersWithSecrets: users });
  });
});

app.get("/submit", (req, res) => {
  res.render("submit");
});

app.post("/submit", (req, res) => {
  const secret = req.body.secret;

  User.findById(req.session.userId, (err, user) => {
    user.secret = secret;
    user.save(() => {
      res.redirect("/secrets");
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
