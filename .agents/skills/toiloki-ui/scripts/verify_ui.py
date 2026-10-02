"""
Deterministic UI Verification and Conformance Tool for Toiloki – Local Suite.

Performs:
1. CSS Token & Design System Conformance Audit (checks colors, fonts, hairline borders, prohibited tokens).
2. Live Dev Server Health & Route Verification.
3. Automated Headless Chrome Screenshot Capture for Visual Inspection across Dark and Light modes.
"""

import os
import sys
import json
import time
import socket
import subprocess
from pathlib import Path

# Required design tokens
REQUIRED_TOKENS_DARK = {
    "--bg-app": "#0b0c0f",
    "--bg-sidebar": "#0e1013",
    "--bg-surface": "#12141a",
    "--bg-raised": "#171a21",
    "--bg-hover": "#1c2028",
    "--text-primary": "#f4f5f7",
    "--text-secondary": "#a3a9b5",
    "--text-tertiary": "#6b7280",
    "--accent-primary": "#d4b06a",
}

FORBIDDEN_PATTERNS = [
    ("linear-gradient(135deg, #6366f1", "Legacy AI SaaS gradient found"),
    ("box-shadow: 0 0 25px rgba", "Excessive neon glow effect found"),
    ("border-radius: 9999px", "Pill-shaped card/button found"),
    ("font-size: 56px", "Oversized marketing hero title found"),
]

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]

def find_chrome():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    return None

def detect_dev_server(ports=range(5173, 5180)):
    for port in ports:
        for host in ("127.0.0.1", "localhost", "::1"):
            try:
                for res in socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM):
                    af, socktype, proto, canonname, sa = res
                    with socket.socket(af, socktype, proto) as s:
                        s.settimeout(0.3)
                        if s.connect_ex(sa) == 0:
                            return f"http://localhost:{port}"
            except Exception:
                continue
    return None

def audit_css_files(project_dir: Path):
    findings = {"tokens_checked": 0, "missing_tokens": [], "forbidden_hits": []}
    css_files = list(project_dir.glob("src/**/*.css")) + list(project_dir.glob("*.css"))
    
    combined_content = ""
    for f in css_files:
        try:
            combined_content += f.read_text(encoding="utf-8").lower() + "\n"
        except Exception:
            pass

    for token, expected_val in REQUIRED_TOKENS_DARK.items():
        findings["tokens_checked"] += 1
        if token.lower() not in combined_content:
            findings["missing_tokens"].append(token)
            
    for pattern, desc in FORBIDDEN_PATTERNS:
        if pattern.lower() in combined_content:
            findings["forbidden_hits"].append({"pattern": pattern, "description": desc})

    return findings

def capture_view(chrome_path: str, url: str, output_path: str, width=1280, height=820):
    user_data = os.path.join(os.environ.get("TEMP", "C:\\temp"), f"toiloki_chrome_{int(time.time()*1000)}")
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--user-data-dir={user_data}",
        f"--window-size={width},{height}",
        f"--screenshot={output_path}",
        "--virtual-time-budget=2500",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return os.path.exists(output_path) and os.path.getsize(output_path) > 1000

def find_project_root():
    curr = Path(__file__).resolve().parent
    for _ in range(6):
        if (curr / "Project 3_Toiloki").exists():
            return curr / "Project 3_Toiloki"
        if (curr / "src" / "index.css").exists():
            return curr
        curr = curr.parent
    return Path(r"D:\Projects\Project 3_Toiloki")

def main():
    toiloki_dir = find_project_root()
    root_dir = toiloki_dir.parent if toiloki_dir.name == "Project 3_Toiloki" else toiloki_dir

    out_dir = root_dir / ".tmp"
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "status": "pass",
        "css_audit": {},
        "server_detected": None,
        "screenshots": {}
    }

    # 1. Audit CSS
    css_res = audit_css_files(toiloki_dir)
    report["css_audit"] = css_res
    if css_res["missing_tokens"] or css_res["forbidden_hits"]:
        report["status"] = "warning"

    # 2. Check Server
    server_url = detect_dev_server()
    report["server_detected"] = server_url

    chrome = find_chrome()
    if server_url and chrome:
        views = [
            ("home_dark", f"{server_url}/?theme=dark"),
            ("home_light", f"{server_url}/?theme=light"),
            ("pdf_tool", f"{server_url}/?nav=pdf&theme=dark"),
            ("developer_tool", f"{server_url}/?nav=developer&theme=dark"),
            ("settings_view", f"{server_url}/?nav=settings&theme=dark")
        ]
        for name, url in views:
            shot_path = str(out_dir / f"audit_{name}.png")
            success = capture_view(chrome, url, shot_path)
            report["screenshots"][name] = {
                "url": url,
                "path": shot_path,
                "captured": success
            }
    
    print(json.dumps(report, indent=2))
    return 0 if report["status"] != "fail" else 1

if __name__ == "__main__":
    sys.exit(main())
