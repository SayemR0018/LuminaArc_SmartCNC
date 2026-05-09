from pywinauto import Application
import time
import sys

def auto_start_lasergrbl():
    try:
        print("Connecting...")
        app = Application(backend="uia").connect(path="LaserGRBL.exe", timeout=10)
        print("Connected.")
        
        main_window = app.window(title_re=".*LaserGRBL.*")
        print("Waiting for ready...")
        main_window.wait("ready", timeout=5)
        print("Ready.")
        
        print("Invoking File menu...")
        menu = main_window.child_window(title="File", control_type="MenuItem")
        menu.invoke()
        time.sleep(1.0) # give it a moment to expand
        
        print("Trying to invoke Send To Machine...")
        # Search globally in the top window for the item
        send_btn = main_window.child_window(title="Send To Machine", control_type="MenuItem")
        send_btn.invoke()
        print("Success via global search!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        try:
            print("Fallback: Using type_keys...")
            main_window.type_keys("%fs") # Alt+F, S (guess?)
        except:
            pass

if __name__ == "__main__":
    auto_start_lasergrbl()
