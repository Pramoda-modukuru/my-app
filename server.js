const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = process.env.PORT || 3000;

// Set the path for ffmpeg binaries
ffmpeg.setFfmpegPath('C:\\ffmpeg\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe');

app.use(express.json());

// Serve the "uploads" folder and "output" folder as static directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Serve index.html from templates directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html')); // Adjust the path to match your 'templates' directory
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// Upload video endpoint
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'Video uploaded successfully!', video_path: `/uploads/${req.file.filename}` });
});

// Convert video to GIF
app.post('/convert', (req, res) => {
    const { video_path, start_time, end_time } = req.body;

    // Ensure video_path is correct and construct the correct file path
    const videoFilePath = path.join(__dirname, 'uploads', path.basename(video_path)); // Correct to avoid duplication
    const outputGif = path.join(__dirname, 'output', `${Date.now()}.gif`);

    // Log the video file path for debugging
    console.log('Video file path:', videoFilePath);

    // Check if start_time and end_time are valid
    if (isNaN(start_time) || isNaN(end_time)) {
        return res.status(400).json({ error: 'Invalid start_time or end_time' });
    }

    // Run the ffmpeg command to convert the video to a GIF
    ffmpeg(videoFilePath)
        .setStartTime(start_time)
        .setDuration(end_time - start_time)
        .output(outputGif)
        .on('end', () => {
            // Construct the path to the GIF file
            const gifPath = `/output/${path.basename(outputGif)}`;
            res.json({ message: 'GIF created successfully!', gif_path: gifPath });
        })
        .on('error', (err) => {
            console.error('Error creating GIF:', err);
            res.status(500).json({ error: 'Error creating GIF', details: err.message });
        })
        .run();
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
