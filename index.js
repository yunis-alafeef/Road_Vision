const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// API endpoint for detecting damage
app.post('/api/detect', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;

    // We will call a python script to run inference.
    // Make sure Python and ultralytics are installed.
    const pythonScript = path.join(__dirname, 'detect.py');
    const command = `python "${pythonScript}" "${imagePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing python script: ${error.message}`);
            return res.status(500).json({ error: 'Failed to process image. Ensure Python and ultralytics are installed.' });
        }
        
        try {
            // The python script should print JSON to stdout
            const result = JSON.parse(stdout);
            res.json(result);
        } catch (parseError) {
            console.error('Error parsing python output:', parseError);
            console.error('Python stdout:', stdout);
            console.error('Python stderr:', stderr);
            res.status(500).json({ error: 'Invalid output from detection model.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
