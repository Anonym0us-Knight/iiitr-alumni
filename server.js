const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session'); // Import express-session
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session setup (this stores session data on the server)
app.use(session({
    secret: 'your-secret-key',  // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }   // Set to true if using HTTPS
}));

// Set up database
let db = new sqlite3.Database(':memory:');

// Create tables
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, user TEXT, content TEXT)");
});

// Insert a test user (For testing login)
db.run("INSERT INTO users (email, password) VALUES (?, ?)", ["test@example.com", "password123"]);

// Middleware to check if the user is logged in
function checkAuth(req, res, next) {
    if (req.session.user) {
        next(); // User is authenticated, proceed to the next function
    } else {
        res.redirect('/login'); // User not logged in, redirect to login page
    }
}

// Routes

// Login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Handle login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
        if (user) {
            // Set session
            req.session.user = user; // Store user data in the session
            res.redirect('/posts');
        } else {
            res.send("Login failed. Try again.");
        }
    });
});

// Universal post page (Protected route)
app.get('/posts', checkAuth, (req, res) => {  // Apply the `checkAuth` middleware to protect this route
    db.all("SELECT * FROM posts", [], (err, posts) => {
        res.render('posts', { posts });
    });
});

// Handle posting
app.post('/post', checkAuth, (req, res) => {  // Protect the posting route as well
    const content = req.body.content;
    const user = req.session.user.email; // Use the logged-in user's email
    db.run("INSERT INTO posts (user, content) VALUES (?, ?)", [user, content], () => {
        res.redirect('/posts');
    });
});

// Donation page (Open to anyone)
app.get('/donate', (req, res) => {
    res.sendFile(__dirname + '/donate.html');
});

// Start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// Logout route
app.get('/logout', (req, res) => {
    // Destroy the session and redirect to login
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login');
    });
});
// Create tables
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, user TEXT, content TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS blogs (id INTEGER PRIMARY KEY, user TEXT, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Blog page (Protected route)
app.get('/blogs', checkAuth, (req, res) => {
    db.all("SELECT * FROM blogs ORDER BY created_at DESC", [], (err, blogs) => {
        if (err) {
            return res.send('Error fetching blogs');
        }
        res.render('blogs', { blogs });
    });
});

// Handle creating a blog post
app.post('/blog', checkAuth, (req, res) => {
    const { title, content } = req.body;
    const user = req.session.user.email; // Use the logged-in user's email
    db.run("INSERT INTO blogs (user, title, content) VALUES (?, ?, ?)", [user, title, content], (err) => {
        if (err) {
            return res.send('Error posting blog');
        }
        res.redirect('/blogs');
    });
});



// Create tables for jobs
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Job page (No authentication required)
app.get('/jobs', (req, res) => {
    db.all("SELECT * FROM jobs ORDER BY created_at DESC", [], (err, jobs) => {
        if (err) {
            return res.send('Error fetching jobs');
        }
        res.render('jobs', { jobs });
    });
});

// Handle job post submissions (No authentication required)
app.post('/job', (req, res) => {
    const { title, content } = req.body;
    db.run("INSERT INTO jobs (title, content) VALUES (?, ?)", [title, content], (err) => {
        if (err) {
            return res.send('Error posting job');
        }
        res.redirect('/jobs');
    });
});
