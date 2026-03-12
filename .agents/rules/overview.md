---
trigger: always_on
---

SNOW Quick Ticket is a Chrome extension that streamlines ServiceNow incident creation for support agents. Instead of navigating the full SNOW interface, agents access a compact popup form with only the fields needed to create a ticket: short description, category, priority, impact, urgency, assignment group, and more.
A template system lets teams pre-configure common request types — such as VPN issues or hardware failures — so agents pre-fill the form in one click and only complete the remaining blanks. All form fields build a live JSON payload that is submitted directly to the ServiceNow Table API (POST /api/now/table/incident) from a background service worker, keeping credentials secure and isolated from the UI layer.
Configuration (instance URL, Bearer token or Basic Auth) is stored locally via chrome.storage.local and managed through a dedicated Options page. A session history view tracks submitted tickets and their INC numbers.
Built with Manifest V3, vanilla JS, and no external framework, the extension is lightweight and easy to maintain. Delivery is split into three phases: core form and API submission, template management, and enhanced UX features.
Goal: faster tickets, less friction, happier agents.