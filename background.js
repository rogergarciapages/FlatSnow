/**
 * background.js - Service Worker for SNOW Quick Ticket
 * Handles API calls to ServiceNow.
 */

// Import storage logic helpers if needed, or re-implement if standalone.
// In V3, we can't easily share code without ES modules or copying.
// I'll re-implement getConfig here for robustness.

const StorageKeys = {
    CONFIG: 'snow_config'
};

const getConfig = async () => {
    return new Promise((resolve) => {
        chrome.storage.local.get([StorageKeys.CONFIG], (result) => {
            resolve(result[StorageKeys.CONFIG] || {
                instanceUrl: '',
                authType: 'bearer',
                token: '',
                username: '',
                password: ''
            });
        });
    });
};

/**
 * Message Listener
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUBMIT_TICKET') {
        handleSubmit(message.payload).then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

/**
 * Handle Ticket Submission to SNOW
 */
async function handleSubmit(payload) {
    const config = await getConfig();

    if (!config.instanceUrl) {
        return { success: false, error: 'ServiceNow Instance URL not configured. Go to Options.' };
    }

    const endpoint = `${config.instanceUrl.replace(/\/$/, '')}/api/now/table/incident`;

    // Construct Headers
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (config.authType === 'bearer') {
        if (!config.token) return { success: false, error: 'Bearer Token missing.' };
        headers['Authorization'] = `Bearer ${config.token}`;
    } else {
        if (!config.username || !config.password) return { success: false, error: 'Credentials missing.' };
        const auth = btoa(`${config.username}:${config.password}`);
        headers['Authorization'] = `Basic ${auth}`;
    }

    try {
        console.log(`Submitting to: ${endpoint}`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // SNOW returns the created object in result.result
            const incidentNumber = result.result?.number || 'INC-TEMP';
            return {
                success: true,
                incident_number: incidentNumber,
                sys_id: result.result?.sys_id
            };
        } else {
            console.error('SNOW API Error:', result);
            const errorDetail = result.error?.message || result.error?.detail || response.statusText;
            return {
                success: false,
                error: `SNOW API (${response.status}): ${errorDetail}`
            };
        }
    } catch (err) {
        console.error('Network/Fetch Error:', err);
        return { success: false, error: `Connection failed: ${err.message}` };
    }
}
