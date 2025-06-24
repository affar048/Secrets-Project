const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

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
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/register", (req, res) => {
  res.render("register", { error: "" });
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render("register", { error: "All fields are required." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { error: "Email already exists." });
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, passwordHash: hash });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("register", { error: "Something went wrong. Try again." });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { error: "" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "All fields are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "User not found." });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.render("login", { error: "Wrong password." });
    }

    req.session.userId = user._id;
    res.redirect("/secrets");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Something went wrong. Try again." });
  }
});

app.get("/secrets", isAuthenticated, async (req, res) => {
  const usersWithSecrets = await User.find({ secret: { $ne: null } });
  res.render("secrets", { usersWithSecrets });
});

app.get("/submit", isAuthenticated, (req, res) => {
  res.render("submit");
});

app.post("/submit", isAuthenticated, async (req, res) => {
  const secret = req.body.secret;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }
    user.secret = secret;
    await user.save();
    res.redirect("/secrets");
  } catch (err) {
    console.error("Submit error:", err);
    res.redirect("/submit");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
