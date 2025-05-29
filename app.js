const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb+srv://affaraffu:EMnXrteiNbuJJNHS@secrets.0h0mz0y.mongodb.net/?retryWrites=true&w=majority&appName=secrets", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  secret: String,
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

// Session setup (adjust cookie secure for production HTTPS)
app.use(session({
  secret: "yourSecretKey", // Replace with strong secret in prod
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Change to true if HTTPS enabled
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Routes

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// Register
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.render("register", { error: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("register", { error: "Invalid email format." });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.render("register", { error: "Password must be at least 6 characters, including uppercase, lowercase, and a number." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword,
    });

    await newUser.save();

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "An error occurred during registration. Please try again." });
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "Please enter both email and password." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", { error: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.render("login", { error: "Incorrect password." });
    }

    // Save user ID in session
    req.session.userId = user._id;
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Login failed. Please try again." });
  }
});

// Secrets page (protected)
app.get("/secrets", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const usersWithSecrets = await User.find({ secret: { $ne: null } }, 'name secret');
    const currentUser = await User.findById(req.session.userId, 'name email');

    res.render("secrets", {
      usersWithSecrets,
      currentUser
    });
  } catch (err) {
    console.error(err);
    res.send("Error loading secrets.");
  }
});

// Submit secret (protected)
app.get("/submit", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("submit");
});

app.post("/submit", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const submittedSecret = req.body.secret;

  try {
    const user = await User.findById(req.session.userId);
    if (user) {
      user.secret = submittedSecret;
      await user.save();
      res.redirect("/secrets");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/submit");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      res.send("Error logging out.");
    } else {
      res.clearCookie('connect.sid'); // Clear cookie explicitly
      res.redirect("/login");
    }
  });
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
