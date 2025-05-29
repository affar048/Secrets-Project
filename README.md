# Secrets Web Application

## Project Overview
The Secrets app is a secure platform that allows users to register, login, and anonymously share their secrets. This project emphasizes robust authentication, secure session management, and best practices in web security.

## Features
- **User Registration:** Validates name, email, and password with strong password policies.
- **Secure Login:** Passwords are hashed using bcrypt.
- **Session Management:** Uses secure, HttpOnly cookies and express-session.
- **Secret Sharing:** Authenticated users can submit secrets and view secrets shared by others.
- **Logout:** Proper session destruction and redirect to login.
- **Responsive UI:** Clean and user-friendly interface with Bootstrap.

## Technologies Used
- Node.js
- Express.js
- MongoDB with Mongoose
- EJS templating engine
- bcrypt for password hashing
- express-session for session management
- Bootstrap for UI styling

## Installation and Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/secrets-app.git
   cd secrets-app
