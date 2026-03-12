# SNOW Quick Ticket 🚀

A premium, high-efficiency Chrome extension designed for rapid ServiceNow incident creation. **SNOW Quick Ticket** provides a streamlined interface that eliminates the clutter of the standard ServiceNow UI, allowing agents to focus on data entry while automating the rest.

![SNOW Quick Ticket Preview](assets/images/icon128.png)

## ✨ Key Features

- **Blazing Fast Entry**: A minimal, optimized form targeting only the fields you actually need.
- **Smart Templates**: Create, edit, export, and import ticket templates. Supports both internal memory and pre-packaged JSON files.
- **Dynamic Variables**: Use `{{ Variable Name }}` tokens in your description fields. They auto-populate with live data from your form (e.g., `{{ Restaurant Name }}`).
- **Intelligent Categorization**: Integrated multi-level ServiceNow categorization (Category > L1 > L2) that automatically maps the correct **Affected CI**.
- **Restaurant Search**: Instant search for thousands of locations by ID or Name with full keyboard navigation (arrows + enter/tab).
- **"Apply to Page" Engine**: Advanced field injection that tunnels through ServiceNow's nested iframes to fill the underlying native form automatically.
- **Session History**: Keeps a rolling list of your recently created tickets for quick reference and copy-pasting.

## 🛠️ Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **"Developer mode"** (top right toggle).
4.  Click **"Load unpacked"** and select the root folder of this project.

## ⚙️ Configuration

1.  Click the **Gear icon** (Options) in the extension.
2.  Enter your **ServiceNow Instance URL** (e.g., `https://yourdomain.service-now.com`).
3.  Choose your authentication method (Basic Auth or Bearer Token).
4.  Save your settings.

## 📂 Project Structure

- `/assets`: Contains images, categorization JSONs, and bundled templates.
- `/components`: Modular HTML parts for the popup (New Ticket, Templates, History).
- `/js/functions`: Core logic split into specific modules (Templates, Restaurants, Utility, etc.).
- `popup.js`: The main orchestrator of the extension UI.
- `content_script.js`: The "brain" that interacts with the ServiceNow webpage.
- `storage.js`: Secure wrapper for `chrome.storage.local`.

## 🤝 Contributing

This extension is built with vanilla JS and CSS for maximum performance. If you want to add new field mappings, look at `content_script.js` and extend the `fieldMap` object.

---
*Built for speed, designed for productivity.*
