# Smart CNC Automated Pen Plotter
This project presents a fully automated system that converts a user-selected image into CNC-compatible G-code for a pen plotter machine. The system integrates AI background removal, image processing, vector conversion, toolpath generation, and auto-execution into a single workflow.

---

## Project Overview
The goal of this project is to simplify the process of converting images into CNC pen plotter drawings.

Traditional workflows require multiple tools and manual processing steps. This system automates the entire pipeline from image selection to final G-code generation using a graphical interface and Python-based backend processing. It now also features a direct integration with **LaserGRBL** to instantly load and auto-play your plotter!

---

## Features 
- Fully automated image-to-Gcode pipeline
- Dual drawing modes
   1. **Outline Mode**: Traces the exact contour edges of the image.
   2. **Shading / Hatch Mode**: Fills in dark areas with precise hatching.
- AI background removal via API
- Automatic raster to vector conversion
- CNC machine scaling and centering
- Automatic G-code generation specifically optimized for Servo-based Pen plotters
- **LaserGRBL Auto-Start**: Automatically launches LaserGRBL, connects, loads the file, and clicks play!

---

## System Workflow
```text
User Image + Mode Selection
        ↓
AI Background Removal
        ↓
White Background Conversion
        ↓
Mode Selection
   /           \
Outline       Shading
   \           /
Raster → Vector (SVG)
        ↓
SVG Cleanup
        ↓
G-Code Generation
        ↓
Auto-Launch LaserGRBL & Auto-Play
        ↓
CNC Pen Plot Drawing
```

---

## Hardware Used
- CNC Pen Plotter Frame
- Stepper Motors (X–Y Axis)
- Servo Motor (Pen Up / Down Control)
- Arduino Uno
- CNC Shield
- Stepper Motor Drivers
- Power Supply Unit

---

## Software Stack
This project uses the following technologies:

- **Python**
- **Tkinter** – GUI development
- **Pillow** – Image processing
- **Requests** – API communication
- **svgpathtools** – SVG path processing
- **Potrace** – Raster to vector conversion
- **pywinauto** – Windows GUI automation for auto-starting the job
- **LaserGRBL / Universal G-code Sender** – CNC machine control

---

## Project Structure
```text
smart-cnc-automated-pen-plotter
├── GUI.py                # Graphical user interface
├── ftest2.py             # Image processing + G-code generation
├── potrace-1.16.win64/   # Potrace executable for raster-to-vector
├── README.md             # Project documentation
├── requirements.txt      # Python dependencies
└── images/
    └── cnc_machine.jpg   # CNC machine photo
```

---

## Installation
Install the required Python libraries using pip:

```bash
pip install pillow
pip install requests
pip install svgpathtools
pip install numpy
pip install opencv-python
pip install pywinauto
```
*(Or install using: `pip install -r requirements.txt`)*

---

## Background Removal API
This project requires an external **background removal API** to remove the background from input images.

The current implementation uses *Picsart Remove Background API*, but other tools or services can also be used.

**Configuration:** The API key should be placed at the top of `ftest2.py` in the `PICSART_API_KEY` variable, or configured as an environment variable before running the project.

---

## Vector Conversion Tool

This project requires a **raster-to-vector conversion tool** to convert processed images into SVG paths.

The current implementation uses **Potrace** (included in the `potrace-1.16.win64` folder). The script automatically routes the processed PNG image through Potrace to generate SVG vector paths that can be processed for G-code generation.

---

## Running the Project
Make sure all files are in the same directory, then run the application:

```bash
python GUI.py
```

### Steps

1. Browse and select an image file.
2. Choose your preferred processing mode (Outline or Shading).
3. Click **RUN PROCESS**.

The system will automatically process the image, generate CNC G-code, launch LaserGRBL, load the file, and automatically hit play!

---

## Example Output

The following image shows an example drawing produced by the **Smart CNC Automated Pen Plotter** using the shading mode.

<p align="center">
  <img src="images/output.jpg.jpeg" width="600">
</p>


## CNC Machine Control
The generated G-code is executed using a **GRBL-based CNC control system**.

The machine receives **G-code commands** from a G-code sender such as **LaserGRBL** or **Universal G-code Sender**. The firmware used for machine control is **GRBL**, configured to handle servo motors (using M3/M5 spindle commands) for pen up/down movements.

---

## Future Improvements
Possible future enhancements for this project include:

- Path optimization for faster plotting
- Multi-pen color drawing support
- Real-time preview simulation
- Mobile or cloud-based control
- Improved shading algorithms
