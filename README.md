
# DRH SINGER PROTOCOL

**Cross-platform implementation of the DRH-Singer protocol.**

This repository serves as the **Distributed Schema Registry** and messaging engine for the DRH ecosystem. It contains standardized libraries for both **Python** and **TypeScript**, enabling any Singer Tap to emit compliant `SCHEMA`, `RECORD`, and `STATE` messages to `stdout` for ingestion by the Diabetes Research Hub (DRH).

## 📂 Project Structure

* **`core-schemas/`**: Central JSON definitions for all DRH streams.
* **`python-pkg/`**: Python distribution providing the `DRHLoader` and validation tools.
* **`typescript-pkg/`**: TypeScript distribution for Node.js-based taps or validation tools.

---

## 🐍 Python Implementation

Designed to be used within Python-based Taps (like `tap-simplera.py`) to handle standardized output.

### 1. Installation

Install directly from the Git subdirectory:

```bash
pip install "git+https://github.com/USERNAME/REPO_NAME.git#subdirectory=python-pkg"

```

### 2. Usage

```python
from drh_target.loader import DRHLoader

# Initialize loader (emits to stdout)
loader = DRHLoader()

# Emit standard Singer messages
loader.emit_schema("participant", schema_dict, key_properties=["record_id"])
loader.emit_record("participant", {"record_id": "123", "status": "active"})

```

---

## 📘 TypeScript Implementation

A modern TypeScript implementation for the DRH-Singer protocol.

### 1.Installation

Add the dependency to your `package.json` using the Git URL:

```bash
npm install "https://github.com/USERNAME/REPO_NAME.git#typescript-pkg"

```

### 2.Usage

```typescript
import { DRHLoader } from 'drh-target-typescript';

const loader = new DRHLoader();
loader.emitRecord("study", { study_id: "S001", name: "Clinical Trial A" });

```

---

## 📦 Managing Dependencies (`node_modules`)

### Why `node_modules` is omitted from Git

In this repository, the `node_modules` folder is listed in the `.gitignore` and is **not** committed.

* **Size & Bloat:** `node_modules` contains thousands of files that would slow down the repository.
* **Platform Specificity:** Some dependencies are compiled specifically for the operating system (Windows vs Linux) where `npm install` was run.
* **Version Control:** We commit `package.json` and `package-lock.json` instead. These files act as the "instruction manual" for recreating the exact environment.

### How to get `node_modules` on your machine

When you clone the repository or add it to a new project, the folder will be missing. You must generate it locally by running:

```bash
# Navigate to the package directory
cd typescript-pkg

# Install/Restore all dependencies
npm install

```

---

## 🔄 Maintenance & Updates

Since this is the "Source of Truth," any changes must be made centrally:

1. **Update Schema**: Add/Edit `.json` definitions in `core-schemas/`.
2. **Sync**: Run `./sync-schemas.sh` to update the language-specific distribution folders.
3. **Commit & Push**: Push changes to the `main` branch.
4. **Client Update**: Taps must re-run `pip install` or `npm install` to pull the latest definitions from the Git remote.

---

## 🛠 Troubleshooting Remote Installs

* **Access Denied**: Ensure the machine has SSH keys or a Personal Access Token (PAT) for private Git access.
* **Python venv**: Always run your Tap inside a virtual environment to avoid dependency conflicts. Your `tap_simplera.py` includes a bootstrap logic to handle this automatically.
* **TS Compilation**: Ensure your `tsconfig.json` is set up to resolve modules from the Git-installed path.

---

