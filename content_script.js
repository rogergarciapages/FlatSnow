/**
 * content_script.js - Handles field injection into the SNOW interface
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILL_SNOW_FORM') {
        const data = message.payload;
        console.log("[FlatSnow] Applying data to page:", data);

        const findField = (id, root = document) => {
            // Priority 1: Check standard ID
            let el = root.getElementById(id);
            if (el) return el;

            // Priority 2: Check by name attribute (often used in SNOW)
            el = root.querySelector(`[name="${id}"]`);
            if (el) return el;

            // Priority 3: Check common SNOW variations
            const variations = [
                `incident.${id}`,
                `ni.incident.${id}`,
                `sys_display.incident.${id}`,
                id.replace('incident.', '')
            ];
            for (const v of variations) {
                el = root.getElementById(v) || root.querySelector(`[name="${v}"]`);
                if (el) return el;
            }

            // Priority 4: Check iframes (SNOW loves gsft_main)
            const iframes = root.querySelectorAll('iframe');
            for (const frame of iframes) {
                try {
                    const doc = frame.contentDocument || frame.contentWindow.document;
                    el = findField(id, doc);
                    if (el) return el;
                } catch (e) {
                    // CORS or other frame errors
                }
            }
            return null;
        };

        try {
            const fieldMap = {
                'short_description': ['incident.short_description', 'short_description'],
                'description': ['incident.description', 'description'],
                'category': ['incident.category', 'category'],
                'subcategory_l1': ['incident.subcategory', 'subcategory'],
                'impact': ['incident.impact', 'impact'],
                'urgency': ['incident.urgency', 'urgency'],
                'assignment_group': ['sys_display.incident.assignment_group', 'sys_display.assignment_group'],
                'assigned_to': ['sys_display.incident.assigned_to', 'sys_display.assigned_to'],
                'caller_id': ['sys_display.incident.caller_id', 'sys_display.caller_id', 'incident.caller_id', 'caller_id'],
                'restaurant_search': ['sys_display.incident.caller_id', 'sys_display.caller_id', 'incident.u_restaurant', 'u_restaurant'],
                'contact_method': ['incident.contact_type', 'contact_type'],
                'u_restaurant': ['incident.u_restaurant', 'u_restaurant'],
                'cmdb_ci': ['sys_display.incident.cmdb_ci', 'sys_display.cmdb_ci', 'cmdb_ci']
            };

            let fieldsFilled = 0;

            Object.keys(fieldMap).forEach(key => {
                const value = data[key];
                if (!value) return;

                const possibleIds = fieldMap[key];
                for (let id of possibleIds) {
                    const el = findField(id);
                    if (el) {
                        console.log(`[FlatSnow] Filling field: ${id} with value: ${value}`);
                        el.value = value;
                        // Trigger essential SNOW events
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('blur', { bubbles: true }));

                        // If it's a reference field (like caller_id), we might need to trigger the lookup helper
                        if (id.startsWith('sys_display.')) {
                            const realFieldId = id.replace('sys_display.', '');
                            const realField = findField(realFieldId);
                            if (realField) {
                                // Note: We don't have the sys_id here, but often setting the display name is enough for the user to click save
                            }
                        }

                        fieldsFilled++;
                        break;
                    }
                }
            });

            sendResponse({ success: true, fieldsCount: fieldsFilled });
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    }
    return true;
});
