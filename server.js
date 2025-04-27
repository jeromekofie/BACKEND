const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// File storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Load existing projects
const loadProjects = () => {
    if (!fs.existsSync('projects.json')) {
        fs.writeFileSync('projects.json', JSON.stringify([]));
    }
    const data = fs.readFileSync('projects.json');
    return JSON.parse(data);
};

// Save projects
const saveProjects = (projects) => {
    fs.writeFileSync('projects.json', JSON.stringify(projects, null, 2));
};

// API to submit a project
app.post('/api/projects', upload.single('file'), (req, res) => {
    try {
        if (!req.body.title || !req.body.description || !req.file) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const projects = loadProjects();
        const newProject = {
            title: req.body.title,
            description: req.body.description,
            file: req.file.path,
            fileUrl: `/uploads/${req.file.filename}`,
            videoLink: req.body.videoLink,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
        saveProjects(projects);
        res.json({ message: 'Project submitted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// API to get all projects
app.get('/api/projects', (req, res) => {
    const projects = loadProjects();
    res.json(projects);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});