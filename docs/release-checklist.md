# Toiloki Release & Packaging Checklist

**Application:** Toiloki – Local Suite  
**Target Environment:** Windows 10 / Windows 11 (x64)  
**Security Model:** 100% Offline, Strict Local Sandbox, Zero Telemetry  
**Release Version:** v1.0.0  

---

## 1. Build & Packaging Targets

Toiloki uses `electron-builder` to produce deterministic, self-contained desktop binaries:

### 1.1 Packaging Commands
- **Directory Test Build (Unpacked):**
  ```powershell
  npm run electron:pack
  ```
  Generates unpacked application in `dist-electron/win-unpacked/Toiloki.exe`.

- **Production Distribution Package:**
  ```powershell
  npm run electron:dist
  ```
  Builds both the NSIS Setup Installer and standalone Portable executable.

### 1.2 Output Binaries
| Artifact | Filename Pattern | Intended Usage |
| :--- | :--- | :--- |
| **NSIS Installer** | `Toiloki Setup 1.0.0.exe` | Standard Windows installation with start menu & desktop shortcuts, uninstaller in Add/Remove Programs. |
| **Portable Executable** | `Toiloki 1.0.0.exe` | Zero-install single binary for flash drives, air-gapped workstations, and restricted enterprise environments. |

---

## 2. Windows Code-Signing Protocol

Toiloki is distributed with Windows SmartScreen compatibility. Unsigned binaries trigger SmartScreen warnings ("Windows protected your PC").

### 2.1 Owner Certificate Configuration (Placeholder)
Before generating official public binaries:

1. **Obtain an Authenticode Certificate:**
   - Standard OV (Organization Validation) or EV (Extended Validation) code-signing certificate (e.g., DigiCert, Sectigo, or SSL.com).
   - Alternatively, a hardware token (YubiKey / HSM) or Cloud HSM (Azure Trusted Signing).

2. **Environment Variables Configuration (`.env.local` / CI secrets):**
   ```env
   # Local PFX file signing:
   CSC_LINK="path/to/owner_authenticode_cert.pfx"
   CSC_KEY_PASSWORD="<owner_certificate_password>"

   # Or Cloud / Azure Trusted Signing:
   # AZURE_KEY_VAULT_TENANT_ID="..."
   # AZURE_KEY_VAULT_CLIENT_ID="..."
   ```

3. **Manual Signing via `signtool`:**
   ```powershell
   signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /f "certs\toiloki_cert.pfx" /p "<password>" "dist-electron\Toiloki Setup 1.0.0.exe"
   signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /f "certs\toiloki_cert.pfx" /p "<password>" "dist-electron\Toiloki 1.0.0.exe"
   ```

4. **Verification:**
   ```powershell
   signtool verify /pa /v "dist-electron\Toiloki Setup 1.0.0.exe"
   ```

---

## 3. Strict Offline & Zero Auto-Update Policy

1. **No Background Auto-Updater:**
   - Toiloki does **NOT** package `electron-updater`, `squirrel.windows`, or background polling services.
   - The app makes **zero network requests** at launch, during execution, or on shutdown.
2. **Manual Update Flow:**
   - Updates are 100% user-directed.
   - Users download the new installer from the official release repository (e.g. GitHub Releases).
   - Installing over an existing version preserves local `localStorage` preferences and themes in `%APPDATA%\toiloki`.
3. **Integrity & Verification:**
   - SHA-256 checksums (`SHA256SUMS.txt`) are published alongside each release binary.
   - Users can verify file integrity:
     ```powershell
     Get-FileHash -Algorithm SHA256 "Toiloki Setup 1.0.0.exe"
     ```

---

## 4. Clean Machine Acceptance Test Protocol

Verify the release on a clean Windows 10/11 environment (virtual machine or test sandbox with **no Node.js, git, or development tools installed**):

1. **Air-Gap / Offline Test:**
   - Disconnect the network adapter (airplane mode / disabled virtual NIC).
   - Launch `Toiloki Setup 1.0.0.exe` and complete installation.
   - Confirm launch is instantaneous with no hung network timeouts.
2. **Start & UI Smoke:**
   - Confirm default Dark theme loads with high-contrast neutral surfaces.
   - Open PDF workspace, drop a sample PDF with CJK (Chinese/Japanese/Korean) characters.
   - Confirm local CMap fonts render offline with zero missing glyphs.
3. **Core Utility Assertions:**
   - Test PDF Merge & Compress (verify output saved to chosen directory).
   - Test Case Conversion & JSON Formatter in Developer workspace.
   - Test Calculator arithmetic and financial EMI evaluation.
   - Test Password Generator entropy and copy to clipboard.
4. **Theme & Persistence:**
   - In Settings > Appearance, toggle Light mode.
   - Restart the application. Confirm theme and settings persist across restarts.
5. **Uninstall Verification:**
   - Execute uninstaller via Windows Settings > Apps > Installed apps.
   - Confirm removal of desktop shortcuts, start menu entries, and installation directory in `%LOCALAPPDATA%\Programs\toiloki`.
