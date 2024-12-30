const uploadForm = document.getElementById('uploadForm');
const controls = document.getElementById('controls');
const convertForm = document.getElementById('convertForm');
const gifPreview = document.getElementById('gif-preview');
const downloadButton = document.getElementById('downloadButton');
let videoPath = '';

// Handle video upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (data.video_path) {
        videoPath = data.video_path;
        alert(data.message);
        controls.classList.remove('hidden');
    } else {
        alert(data.error);
    }
});

// Handle GIF conversion
convertForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end || isNaN(start) || isNaN(end)) {
        alert('Please provide valid start and end times.');
        return;
    }

    const response = await fetch('/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: videoPath, start_time: start, end_time: end }),
    });

    const data = await response.json();
    const gifPath = data.gif_path;
    gifPreview.src = gifPath;
    downloadButton.classList.remove('hidden');
});
