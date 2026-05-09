import os
import contextlib
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import ftest2

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from React dev server

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/process', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    mode = request.form.get('mode', '1')
    try:
        mode_val = int(mode)
    except ValueError:
        mode_val = 1
        
    if file:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Capture stdout to return the logs to the frontend
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                exit_code = ftest2.main(["--mode", str(mode_val), file_path])
            
            logs = buf.getvalue()
            
            if exit_code == 0:
                return jsonify({
                    "success": True, 
                    "logs": logs,
                    "message": "Processing complete! LaserGRBL should be launching."
                })
            else:
                return jsonify({
                    "success": False, 
                    "logs": logs,
                    "error": "Processing failed. Check logs."
                }), 500
                
        except Exception as e:
            logs = buf.getvalue()
            return jsonify({
                "success": False,
                "logs": logs,
                "error": str(e)
            }), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
