// Import necessary modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const flash = require('connect-flash');
const session = require('express-session');

const app = express();

// Configure app
app.set('view engine', 'ejs'); // Use EJS as the template engine
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static(path.join(__dirname, 'static'))); // Serve static files

app.use(session({
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Mock database of users
const users = { admin: 'password123', user: 'mypassword' };

// Directory for storing uploaded photos
const UPLOAD_FOLDER = path.join(__dirname, 'static/uploads');
fs.mkdirSync(UPLOAD_FOLDER, { recursive: true }); // Ensure the folder exists

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        const ext = file.originalname.split('.').pop().toLowerCase();
        cb(null, allowedExtensions.includes(ext));
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/log', (req, res) => {
    const role = req.body.role;
    if (role === 'admin') {
        res.redirect('/admin_login');
    } else if (role === 'viewer') {
        res.redirect('/welcome_viewer?username=Viewer');
    } else {
        req.flash('error', 'Invalid role selected. Please try again.');
        res.redirect('/');
    }
});

app.route('/admin_login')
    .get((req, res) => {
        res.render('login', { error: req.flash('error') });
    })
    .post((req, res) => {
        const { username, password } = req.body;
        if (users[username] && users[username] === password) {
            res.redirect(`/welcome?username=${username}`);
        } else {
            req.flash('error', 'Invalid username or password!');
            res.redirect('/admin_login');
        }
    });

app.route('/welcome')
    .get((req, res) => {
        const username = req.query.username || 'Guest';
        const photos = fs.readdirSync(UPLOAD_FOLDER);
        res.render('welcome', { username, photos, error: req.flash('error'), success: req.flash('success') });
    })
    .post(upload.single('photo'), (req, res) => {
        if (req.file) {
            req.flash('success', 'Photo uploaded successfully!');
        } else if (req.body.delete_photo) {
            const photoPath = path.join(UPLOAD_FOLDER, req.body.delete_photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
                req.flash('success', 'Photo deleted successfully!');
            } else {
                req.flash('error', 'Photo not found!');
            }
        } else {
            req.flash('error', 'Invalid file format or missing action.');
        }
        res.redirect(`/welcome?username=${req.query.username}`);
    });

app.get('/welcome_viewer', (req, res) => {
    const username = req.query.username || 'Guest';
    const photos = fs.readdirSync(UPLOAD_FOLDER);
    res.render('welcome_viewer', { username, photos });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));







 