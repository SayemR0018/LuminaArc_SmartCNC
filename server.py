import os
import contextlib
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import ftest2
from flask import send_from_directory
from cnc_controller import cnc

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from React dev server

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/uploads/<filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.svgz'}

def allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

@app.route('/api/process', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Unsupported file type. Supported: PNG, JPG, BMP, WEBP, SVG"}), 400
    
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
                base_name = os.path.splitext(file.filename)[0]
                svg_filename = f"{base_name}_clean_m{mode_val}.svg"
                gcode_filename = f"{base_name}_m{mode_val}.gcode"
                
                gcode_abs_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, gcode_filename))
                return jsonify({
                    "success": True, 
                    "logs": logs,
                    "message": "Processing complete! LaserGRBL should be launching.",
                    "svg_url": f"http://localhost:5001/uploads/{svg_filename}",
                    "gcode_url": f"http://localhost:5001/uploads/{gcode_filename}",
                    "gcode_path": gcode_abs_path
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

@app.route('/api/cnc/ports', methods=['GET'])
def cnc_ports():
    return jsonify({"ports": cnc.list_ports()})


@app.route('/api/cnc/connect', methods=['POST'])
def cnc_connect():
    data = request.get_json(silent=True) or {}
    port = data.get("port", "")
    baudrate = int(data.get("baudrate", 115200))
    ok = cnc.connect(port, baudrate)
    return jsonify({"success": ok, "status": cnc.get_status(), "error": cnc.error})


@app.route('/api/cnc/disconnect', methods=['POST'])
def cnc_disconnect():
    cnc.disconnect()
    return jsonify({"success": True, "status": cnc.get_status()})


@app.route('/api/cnc/load', methods=['POST'])
def cnc_load():
    data = request.get_json(silent=True) or {}
    path = data.get("gcode_path", "")
    if not path or not os.path.exists(path):
        return jsonify({"success": False, "error": "G-code file not found"}), 400
    count = cnc.load_gcode(path)
    return jsonify({"success": True, "total_lines": count, "status": cnc.get_status()})


@app.route('/api/cnc/start', methods=['POST'])
def cnc_start():
    ok = cnc.start()
    return jsonify({"success": ok, "status": cnc.get_status(), "error": cnc.error})


@app.route('/api/cnc/pause', methods=['POST'])
def cnc_pause():
    cnc.pause()
    return jsonify({"success": True, "status": cnc.get_status()})


@app.route('/api/cnc/resume', methods=['POST'])
def cnc_resume():
    cnc.resume()
    return jsonify({"success": True, "status": cnc.get_status()})


@app.route('/api/cnc/stop', methods=['POST'])
def cnc_stop():
    cnc.stop()
    return jsonify({"success": True, "status": cnc.get_status()})


@app.route('/api/cnc/status', methods=['GET'])
def cnc_status():
    return jsonify({"status": cnc.get_status()})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
