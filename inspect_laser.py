from pywinauto import Desktop
import sys

windows = Desktop(backend="uia").windows()
found = False
for w in windows:
    if "LaserGRBL" in w.window_text():
        found = True
        print(f"Found window: {w.window_text()}")
        w.print_control_identifiers(depth=6, filename="laser_controls.txt")
        print("Controls saved to laser_controls.txt")
if not found:
    print("LaserGRBL window not found.")
