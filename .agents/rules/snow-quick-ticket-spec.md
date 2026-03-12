# SNOW Quick Ticket — Chrome Extension
### Project Specification v1.0 · March 2026

---

## 1. Overview

SNOW Quick Ticket is a Chrome extension that gives support agents a fast, minimal form for creating ServiceNow incidents without opening the full SNOW interface. It exposes only the fields relevant to ticket creation, supports pre-defined templates for common request types, and submits directly to the ServiceNow REST API.

**Core goals:**
- Reduce average ticket creation time
- Expose only relevant fields — no full SNOW UI navigation
- Allow teams to configure templates for recurring issue types
- Output a validated JSON payload submitted via SNOW Table API

**Target users:** L1/L2 support agents, team leads managing templates, IT admins configuring the SNOW connection.

---

## 2. Extension Architecture

Manifest V3 Chrome extension with four modules:

| File | Type | Responsibility |
|---|---|---|
| `manifest.json` | Config | Permissions, popup entry, service worker declaration |
| `popup.html` / `popup.js` | UI Layer | Form, template selector, live JSON preview, submit |
| `background.js` | Service Worker | SNOW API calls via `fetch()`, message passing from popup |
| `storage.js` | Data Layer | Template CRUD and config via `chrome.storage.local` |
| `options.html` / `options.js` | Settings | Instance URL, API token / OAuth config |

**Required permissions (`manifest.json`):**
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://*.service-now.com/*"],
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js" }
}
```

---

## 3. UI — Views & Behaviour

The popup is **400px wide** with three tab views.

### 3.1 New Ticket (Primary)
The main agent form. All fields update the JSON preview in real time. Required fields are validated before submission.

- **Template bar** — dropdown that triggers instant form pre-fill
- Short Description *(required)*
- Description *(textarea, optional)*
- Category + Subcategory *(paired dropdowns)*
- Priority *(segmented pill buttons: 1–Critical to 5–Planning)*
- Impact + Urgency *(dropdowns)*
- Caller ID + Assignment Group *(text inputs)*
- Config Item / CI *(text input, optional)*

Footer actions: **Clear** · **Copy JSON** · **Submit to SNOW**

### 3.2 Templates
List of saved templates with edit/delete controls. Each card shows name, field summary, and a color dot. A `+ New Template` button opens a creation form.

### 3.3 History
Tickets submitted in the current session. Shows INC number, short description, status badge (Created / Pending / Failed), timestamp, and a copy button for the INC number.

---

## 4. Form Field Specification

| Label | SNOW Field | Type | Notes |
|---|---|---|---|
| Short Description | `short_description` | Text input | Required. Max 160 chars. |
| Description | `description` | Textarea | Optional. |
| Category | `category` | Dropdown | Values configurable per team. |
| Subcategory | `subcategory` | Dropdown | Filtered by selected Category. |
| Priority | `priority` | Pill selector | 1=Critical, 2=High, 3=Med, 4=Low, 5=Planning |
| Impact | `impact` | Dropdown | 1=Enterprise, 2=Dept, 3=Individual |
| Urgency | `urgency` | Dropdown | 1=Critical, 2=High, 3=Normal |
| Caller ID | `caller_id` | Text input | Username or sys_id of affected user. |
| Assignment Group | `assignment_group` | Text input | Group name or sys_id. |
| Config Item | `cmdb_ci` | Text input | Optional. CI name or sys_id. |

---

## 5. Template System

Templates are stored in `chrome.storage.local` as a JSON array. Selecting a template pre-fills matching fields; agents complete the remaining blanks.

**Template data structure:**
```json
{
  "id": "tpl_vpn_001",
  "name": "VPN Issue",
  "color": "#4F8EF7",
  "fields": {
    "category": "network",
    "subcategory": "vpn",
    "priority": "2",
    "assignment_group": "Network Ops",
    "impact": "2",
    "urgency": "1"
  }
}
```

`storage.js` exposes simple `getTemplates()`, `saveTemplate()`, and `deleteTemplate()` helpers wrapping `chrome.storage.local`. Templates are accessible from both popup and options page.

---

## 6. JSON Output & API Integration

The form builder constructs the payload from non-empty field values only. Empty fields are excluded to keep the payload minimal.

**Example output:**
```json
{
  "short_description": "VPN not connecting after update",
  "description": "User reports VPN client errors since 09:00.",
  "category": "network",
  "subcategory": "vpn",
  "priority": "2",
  "impact": "2",
  "urgency": "1",
  "caller_id": "john.doe",
  "assignment_group": "Network Ops"
}
```

**API call (executed in `background.js`):**
```
POST https://{instance}.service-now.com/api/now/table/incident
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

The popup sends the payload via `chrome.runtime.sendMessage()`. The service worker executes the call and returns the SNOW response to the popup.

**Response handling:**

| Code | Meaning | Extension Behaviour |
|---|---|---|
| `201` | Success | Show INC number in History. Toast notification. |
| `400` | Validation error | Display SNOW error message inline. |
| `401` | Auth failure | Prompt user to re-check token in Options. |
| `5xx` | Server error | Retry once, then show failure toast with Copy JSON option. |

---

## 7. Authentication & Configuration

Stored in `chrome.storage.local` (not synced) to keep credentials local. Configured via `options.html`.

- **Instance URL** — e.g. `https://dev-12345.service-now.com`
- **Auth method** — Basic Auth (username + password) or Bearer Token
- **Token / password** — stored locally, never logged or sent to third parties

Credentials are passed to `background.js` at call time and are never directly accessible from `popup.js`, reducing XSS exposure surface.

---

## 8. Technical Stack

| Layer | Technology |
|---|---|
| Platform | Chrome Extension Manifest V3 |
| UI | Vanilla JS + HTML/CSS (no framework — keeps bundle minimal) |
| Storage | `chrome.storage.local` |
| API | `fetch()` in background service worker |
| Auth | Bearer Token or HTTP Basic, set in Options |
| Build | No bundler required for v1. Optionally add esbuild for TypeScript in v2. |

---

## 9. Phased Delivery

**Phase 1 — MVP**
Extension scaffold, full New Ticket form, live JSON preview, SNOW API submission, Basic/Bearer auth config, in-session history.

**Phase 2 — Templates**
Template create/edit/delete UI, storage integration, instant form pre-fill, template export/import as JSON file.

**Phase 3 — Enhancements**
Searchable dropdowns for Group and CI, subcategory auto-filter, priority auto-derivation from Impact + Urgency, persistent ticket history (last 50), option to open created ticket in SNOW.

---

## 10. Out of Scope (v1)

- Ticket editing or updating (create-only)
- Firefox / Edge support
- OAuth 2.0 flow
- Offline / queued submission
- Full ServiceNow UI replacement

---

*Internal Tooling · Confidential*
