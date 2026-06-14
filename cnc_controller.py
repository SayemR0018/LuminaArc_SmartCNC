from __future__ import annotations

import os
import time
import threading
from pathlib import Path


class CNCController:
    def __init__(self):
        self._serial = None
        self.connected = False
        self.running = False
        self.paused = False
        self.gcode_lines: list[str] = []
        self.current_line = 0
        self.total_lines = 0
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()
        self.port = ""
        self.error: str | None = None
        self._simulate = False

    def list_ports(self) -> list[dict]:
        try:
            import serial.tools.list_ports
            ports = []
            for p in serial.tools.list_ports.comports():
                ports.append({"device": p.device, "description": p.description})
            return ports
        except ImportError:
            return []
        except Exception:
            return []

    def connect(self, port: str, baudrate: int = 115200) -> bool:
        try:
            import serial
            self._serial = serial.Serial(port, baudrate, timeout=0.5)
            time.sleep(2)
            self._serial.reset_input_buffer()
            self.connected = True
            self.port = port
            self.error = None
            self._simulate = False
            return True
        except Exception as e:
            self.error = str(e)
            self.connected = False
            return False

    def disconnect(self) -> None:
        self.running = False
        self.paused = False
        if self._serial:
            try:
                self._serial.close()
            except Exception:
                pass
        self._serial = None
        self.connected = False
        self.current_line = 0

    def load_gcode(self, gcode_path: str | Path) -> int:
        with open(gcode_path) as f:
            raw = f.read()
        self.gcode_lines = [
            l.strip() for l in raw.split("\n")
            if l.strip() and not l.strip().startswith("(") and not l.strip().startswith(";")
        ]
        self.current_line = 0
        self.total_lines = len(self.gcode_lines)
        return self.total_lines

    def start(self) -> bool:
        if not self.gcode_lines:
            self.error = "No G-code loaded."
            return False
        if self.running:
            return True
        self.running = True
        self.paused = False
        self.error = None
        if not self.connected:
            self._simulate = True
        self._thread = threading.Thread(target=self._send_loop, daemon=True)
        self._thread.start()
        return True

    def pause(self) -> None:
        with self._lock:
            if not self.paused:
                self.paused = True
                if self.connected and self._serial:
                    try:
                        self._serial.write(b"!")
                    except Exception:
                        pass

    def resume(self) -> None:
        with self._lock:
            if self.paused:
                self.paused = False
                if self.connected and self._serial:
                    try:
                        self._serial.write(b"~")
                    except Exception:
                        pass

    def stop(self) -> None:
        with self._lock:
            self.running = False
            self.paused = False
            if self.connected and self._serial:
                try:
                    self._serial.write(b"\x18")
                except Exception:
                    pass

    def get_status(self) -> dict:
        return {
            "connected": self.connected,
            "running": self.running,
            "paused": self.paused,
            "current_line": self.current_line,
            "total_lines": self.total_lines,
            "progress": round(self.current_line / max(self.total_lines, 1) * 100, 1),
            "port": self.port,
            "error": self.error,
            "simulating": self._simulate,
        }

    def _send_loop(self) -> None:
        while self.running and self.current_line < self.total_lines:
            with self._lock:
                if self.paused:
                    time.sleep(0.1)
                    continue
                line = self.gcode_lines[self.current_line]

            if self.connected and self._serial:
                try:
                    self._serial.write((line + "\n").encode())
                    while self.running:
                        resp = self._serial.readline().decode().strip()
                        if not resp:
                            continue
                        if resp == "ok":
                            break
                        elif resp.startswith("error"):
                            with self._lock:
                                self.error = resp
                            break
                except Exception as e:
                    with self._lock:
                        self.error = str(e)
                        self.running = False
                    break
            else:
                time.sleep(0.01)

            with self._lock:
                self.current_line += 1

        with self._lock:
            self.running = False


cnc = CNCController()
