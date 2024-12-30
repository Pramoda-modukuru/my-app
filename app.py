from flask import Flask, request, render_template, send_from_directory, jsonify
import imageio
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
GIF_FOLDER = 'downloads'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GIF_FOLDER, exist_ok=True)

# Max file size in bytes (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    video = request.files['video']
    if video:
        # Check file size without reading it into memory
        if video.content_length > MAX_FILE_SIZE:
            return jsonify({'error': 'File size exceeds limit'}), 400
        
        video_path = os.path.join(UPLOAD_FOLDER, video.filename)
        video.save(video_path)
        return jsonify({'video_path': video_path, 'message': 'Video uploaded successfully!'})
    
    return jsonify({'error': 'No video uploaded'}), 400

@app.route('/convert', methods=['POST'])
def convert_to_gif():
    data = request.json
    video_path = data.get('video_path')
    start_time = float(data.get('start_time', 0))
    end_time = float(data.get('end_time', 0))

    if not os.path.exists(video_path):
        return jsonify({'error': 'Video file not found'}), 404

    gif_filename = f"{os.path.splitext(os.path.basename(video_path))[0]}.gif"
    gif_path = os.path.join(GIF_FOLDER, gif_filename)

    try:
        # Convert video to GIF
        reader = imageio.get_reader(video_path, 'ffmpeg')
        fps = reader.get_meta_data()['fps']
        video_duration = reader.get_meta_data()['duration']
        
        # Ensure start_time and end_time are within the video duration
        if start_time < 0 or end_time > video_duration or start_time >= end_time:
            return jsonify({'error': 'Invalid time range'}), 400
        
        frames = []
        for i, frame in enumerate(reader):
            current_time = i / fps
            if current_time < start_time:
                continue
            if current_time > end_time:
                break
            frames.append(frame)

        # Check if frames were captured
        if not frames:
            return jsonify({'error': 'No frames captured in the specified time range'}), 400

        # Save GIF with infinite looping
        imageio.mimsave(gif_path, frames, fps=fps, loop=0)
    except Exception as e:
        return jsonify({'error': f"Failed to convert video to GIF: {str(e)}"}), 500

    # Return relative path to the GIF
    return jsonify({'gif_path': f"/download/{gif_filename}", 'message': 'GIF created successfully!'})

@app.route('/download/<filename>', methods=['GET'])
def download(filename):
    gif_path = os.path.join(GIF_FOLDER, filename)
    if os.path.exists(gif_path):
        return send_from_directory(GIF_FOLDER, filename, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
