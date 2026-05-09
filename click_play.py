from pywinauto import Application
import time
import sys

def click_run():
    try:
        app = Application(backend="win32").connect(path="LaserGRBL.exe", timeout=10)
        main_window = app.top_window()
        btn = main_window.child_window(auto_id="BtnRunProgram")
        btn.click_input()
        print("Clicked BtnRunProgram using click_input")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    click_run()
