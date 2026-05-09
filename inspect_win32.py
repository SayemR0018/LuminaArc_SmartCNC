from pywinauto import Application
import sys

app = Application(backend="win32").connect(path="LaserGRBL.exe")
w = app.top_window()
print("Found window via path (win32):", w.window_text())

with open("laser_win32_controls.txt", "w", encoding="utf-8") as f:
    w.print_control_identifiers(depth=7, filename="laser_win32_controls.txt")
print("Saved controls to laser_win32_controls.txt")
