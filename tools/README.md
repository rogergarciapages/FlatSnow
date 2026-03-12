# Automation Tools 🛠️

This directory contains utility scripts to help with the development and maintenance of the **SNOW Quick Ticket** extension.

## 📄 Scripts

### 1. `generate-index.js`
ServiceNow templates are stored as individual `.json` files in `/assets/templates`. To ensure the extension can "discover" new files without hardcoding their names, it reads a central `index.json`.

This script automatically scans the `/assets/templates` directory and updates the `index.json` with the filenames it finds.

**Usage:**
```bash
node tools/generate-index.js
```

### When to run this?
Run this script whenever you:
- Add a new `.json` template manually to the `/assets/templates` folder.
- Remove a template file from the folder.
- Rename a template file.
