import { useState, useRef } from 'react';
import './index.css';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState('');
  const [svgContent, setSvgContent] = useState(null);
  const [gcodeContent, setGcodeContent] = useState(null);
  const [ratioError, setRatioError] = useState('');
  const fileInputRef = useRef(null);
  const terminalRef = useRef(null);

  const isSvg = (f) => f && (f.name.endsWith('.svg') || f.name.endsWith('.svgz'));
  const isRaster = (f) => f && f.type && f.type.startsWith('image/') && !f.name.endsWith('.svg') && !f.name.endsWith('.svgz');

  const checkSquareRatio = (file) => {
    return new Promise((resolve) => {
      if (!file || isSvg(file)) {
        setRatioError('');
        resolve(true);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / h;
        if (Math.abs(ratio - 1.0) > 0.05) {
          setRatioError(`Laser mode requires a square image (1:1 ratio). Got ${w}×${h}.`);
          resolve(false);
        } else {
          setRatioError('');
          resolve(true);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => resolve(true);
      img.src = url;
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (mode === 3 && isRaster(selectedFile)) {
        const ok = await checkSquareRatio(selectedFile);
        if (!ok) {
          e.target.value = '';
          return;
        }
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setLogs('');
      setSvgContent(null);
      setGcodeContent(null);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    const isImage = droppedFile.type.startsWith('image/') || droppedFile.name.endsWith('.svg') || droppedFile.name.endsWith('.svgz');
    if (isImage) {
      if (mode === 3 && isRaster(droppedFile)) {
        const ok = await checkSquareRatio(droppedFile);
        if (!ok) return;
      }
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setLogs('');
      setSvgContent(null);
      setGcodeContent(null);
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
      
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.logs) {
        setLogs(prev => prev + '\n--- Processing Logs ---\n' + data.logs);
      }

      if (response.ok && data.success) {
        setLogs(prev => prev + '\n✅ ' + data.message);
        if (data.svg_url) {
          try {
            const svgResponse = await fetch(data.svg_url);
            let svgText = await svgResponse.text();
            // Remove 'svg:' namespace prefixes if they exist (caused by XML ElementTree)
            svgText = svgText.replace(/<svg:([a-zA-Z0-9-]+)/g, '<$1');
            svgText = svgText.replace(/<\/svg:([a-zA-Z0-9-]+)/g, '</$1');
            setSvgContent(svgText);
          } catch (e) {
            console.error("Could not load SVG preview");
          }
        }
        
        if (data.gcode_url) {
          try {
            const gcodeResponse = await fetch(data.gcode_url);
            const gcodeText = await gcodeResponse.text();
            // Get first 8 lines of G-code
            const previewLines = gcodeText.split('\n').slice(0, 8).join('\n');
            setGcodeContent(previewLines);
          } catch (e) {
            console.error("Could not load GCode preview");
          }
        }
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
              accept={mode === 3 ? "image/*,.svg,.svgz" : "image/*"} 
              style={{ display: 'none' }} 
            />
            
            {previewUrl ? (
              <div className="preview-container" style={{position: 'relative', width: '100%', height: '100%', minHeight: '200px'}}>
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="laser-scanner"></div>
                    <span className="spinner"></span> Generating Toolpath...
                  </div>
                )}
                <img src={previewUrl} alt="Preview" className="preview-image" style={{ width: '100%', height: '100%', objectFit: 'contain', margin: 0, maxHeight: '250px' }} />
                <button className="browse-btn" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }} style={{ marginTop: '1rem', position: 'relative', zIndex: 20 }}>
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
                  onClick={() => { setMode(1); setRatioError(''); }}
                >
                  <div className="mode-icon">〰️</div>
                  <div className="mode-title">Outline</div>
                  <div className="mode-desc">Traces image edges</div>
                </div>
                <div 
                  className={`mode-card ${mode === 2 ? 'active' : ''}`}
                  onClick={() => { setMode(2); setRatioError(''); }}
                >
                  <div className="mode-icon">▒</div>
                  <div className="mode-title">Shading</div>
                  <div className="mode-desc">Fills dark areas</div>
                </div>
                <div 
                  className={`mode-card ${mode === 3 ? 'active' : ''}`}
                  onClick={() => { setMode(3); setRatioError(''); }}
                >
                  <div className="mode-icon">🔥</div>
                  <div className="mode-title">Laser</div>
                  <div className="mode-desc">Vector-only laser gcode</div>
                </div>
              </div>
              {mode === 3 && (
                <div className="mode-note">
                  Laser mode requires an SVG file or a square image (1:1 ratio). It generates laser-safe vector gcode with laser on/off commands.
                </div>
              )}
              {ratioError && (
                <div className="error-note">{ratioError}</div>
              )}
            </div>

            <button 
              className="action-btn" 
              onClick={handleProcess}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <><span className="spinner"></span> Processing...</>
              ) : (
                mode === 3 ? 'Generate Laser G-Code ▶' : 'Generate & Auto-Play ▶'
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="grid-layout" style={{ marginTop: '2rem' }}>
          {/* Terminal Section */}
          {(logs || isProcessing) && (
            <div className="terminal-container" style={{ marginTop: 0 }}>
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

          {/* G-Code Outline Section */}
          {(svgContent || gcodeContent || isProcessing) && (
            <div className="terminal-container" style={{ marginTop: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="dot red"></div>
                  <div className="dot yellow"></div>
                  <div className="dot green"></div>
                </div>
                <div className="terminal-title">G-Code Preview</div>
              </div>
              <div className="terminal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
                {isProcessing ? (
                  <div style={{ flex: 1, color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="spinner"></span> 
                      <span>Generating G-Code...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {svgContent && (
                      <div className="svg-overlay-container" style={{ width: '100%', flex: 1, background: 'transparent' }}>
                        <div className="svg-animation-wrapper" dangerouslySetInnerHTML={{ __html: svgContent }} />
                      </div>
                    )}
                    {gcodeContent && (
                      <div style={{ padding: '1rem', borderTop: '1px solid #333', color: '#0f0', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        <div style={{ color: '#888', marginBottom: '0.5rem', fontSize: '0.75rem' }}>// First few lines of generated G-Code</div>
                        {gcodeContent}
                        {'\n...'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
