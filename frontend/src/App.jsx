import { useState, useRef } from 'react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState('');
  const fileInputRef = useRef(null);
  const terminalRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setLogs(''); // Clear logs on new file
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setLogs('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setLogs('Initializing Smart CNC Process...\n');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode.toString());

    try {
      setLogs(prev => prev + `Uploading ${file.name}...\n`);
      
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.logs) {
        setLogs(prev => prev + '\n--- Processing Logs ---\n' + data.logs);
      }

      if (response.ok && data.success) {
        setLogs(prev => prev + '\n✅ ' + data.message);
      } else {
        setLogs(prev => prev + '\n❌ Error: ' + (data.error || 'Unknown error occurred.'));
      }
    } catch (err) {
      setLogs(prev => prev + '\n❌ Network Error: Could not connect to Python backend.\nMake sure server.py is running on port 5000.');
    } finally {
      setIsProcessing(false);
      // Auto scroll terminal
      if (terminalRef.current) {
        setTimeout(() => {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }, 100);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Smart CNC Plotter</h1>
        <p>Convert images to G-Code automatically</p>
      </div>

      <div className="glass-card">
        <div className="grid-layout">
          {/* Upload Section */}
          <div 
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={triggerFileInput}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button className="browse-btn" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
                  Change Image
                </button>
              </div>
            ) : (
              <>
                <div className="upload-icon">📸</div>
                <div className="upload-text">Drag & drop your image here</div>
                <button className="browse-btn">Browse Files</button>
              </>
            )}
          </div>

          {/* Controls Section */}
          <div className="controls-section">
            <div>
              <div className="section-title">Processing Mode</div>
              <div className="mode-selector">
                <div 
                  className={`mode-card ${mode === 1 ? 'active' : ''}`}
                  onClick={() => setMode(1)}
                >
                  <div className="mode-icon">〰️</div>
                  <div className="mode-title">Outline</div>
                  <div className="mode-desc">Traces image edges</div>
                </div>
                <div 
                  className={`mode-card ${mode === 2 ? 'active' : ''}`}
                  onClick={() => setMode(2)}
                >
                  <div className="mode-icon">▒</div>
                  <div className="mode-title">Shading</div>
                  <div className="mode-desc">Fills dark areas</div>
                </div>
              </div>
            </div>

            <button 
              className="action-btn" 
              onClick={handleProcess}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <><span className="spinner"></span> Processing...</>
              ) : (
                'Generate & Auto-Play ▶'
              )}
            </button>
          </div>
        </div>

        {/* Terminal Section */}
        {(logs || isProcessing) && (
          <div className="terminal-container">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
              </div>
              <div className="terminal-title">server.py</div>
            </div>
            <div className="terminal-body" ref={terminalRef}>
              {logs}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
