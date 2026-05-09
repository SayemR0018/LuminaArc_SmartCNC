from pywinauto import Application
import sys

try:
    app = Application(backend="uia").connect(path="LaserGRBL.exe")
    w = app.top_window()
    print("Found window via path:", w.window_text())
    
    w.print_control_identifiers(depth=4, filename="laser_all_controls.txt")
    print("Saved all controls to laser_all_controls.txt")
except Exception as e:
    print("UIA failed:", e)
