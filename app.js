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

function isLoggedIn(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
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
    return res.render("register", { error: "Please fill all fields." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("register", { error: "Email already registered." });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash: hash });
  await user.save();
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: "" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("login", { error: "Please fill all fields." });
  }

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
});

app.get("/secrets", isLoggedIn, async (req, res) => {
  const users = await User.find({ secret: { $ne: null } });
  res.render("secrets", { users });
});

app.get("/submit", isLoggedIn, (req, res) => {
  res.render("submit");
});

app.post("/submit", isLoggedIn, async (req, res) => {
  const secret = req.body.secret;
  const user = await User.findById(req.session.userId);
  if (user) {
    user.secret = secret;
    await user.save();
  }
  res.redirect("/secrets");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
