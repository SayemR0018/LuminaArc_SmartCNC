from pywinauto import Application
import sys

try:
    app = Application(backend="uia").connect(path="LaserGRBL.exe")
    w = app.top_window()
    print("Found window via path:", w.window_text())
    
    with open("laser_buttons.txt", "w", encoding="utf-8") as f:
        for ctrl in w.descendants(control_type="Button"):
            f.write(f"Name: '{ctrl.element_info.name}', Text: '{ctrl.window_text()}', ID: {ctrl.element_info.control_id}\n")
    print("Saved buttons to laser_buttons.txt")
except Exception as e:
    print("UIA failed:", e)
    
    try:
        app = Application(backend="win32").connect(path="LaserGRBL.exe")
        w = app.top_window()
        print("Found window via path (win32):", w.window_text())
        
        with open("laser_buttons_win32.txt", "w", encoding="utf-8") as f:
            for ctrl in w.descendants(class_name="Button"):
                f.write(f"Text: '{ctrl.window_text()}', ID: {ctrl.control_id()}\n")
        print("Saved buttons to laser_buttons_win32.txt")
    except Exception as e2:
        print("WIN32 failed:", e2)
