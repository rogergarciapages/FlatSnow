/**
 * storage.js - Data Layer for SNOW Quick Ticket
 * Handles all chrome.storage.local interactions safely.
 */

const StorageKeys = {
    TEMPLATES: 'snow_templates',
    CONFIG: 'snow_config',
    HISTORY: 'snow_history'
};

const StorageManager = {
    /**
     * Get all saved templates
     */
    async getTemplates() {
        let fileTemplates = [];
        try {
            const indexResp = await fetch(chrome.runtime.getURL('assets/templates/index.json'));
            if (indexResp.ok) {
                const filenames = await indexResp.json();
                const fetchPromises = filenames.map(async (name) => {
                    try {
                        const resp = await fetch(chrome.runtime.getURL(`assets/templates/${name}`));
                        if (resp.ok) {
                            const data = await resp.json();
                            return { ...data, isFile: true };
                        }
                    } catch (e) { return null; }
                });
                const fetched = await Promise.all(fetchPromises);
                fileTemplates = fetched.filter(t => t !== null);
            }
        } catch (e) { }

        return new Promise((resolve) => {
            chrome.storage.local.get([StorageKeys.TEMPLATES], (result) => {
                const localTemplates = (result[StorageKeys.TEMPLATES] || []).map(t => ({ ...t, isFile: false }));
                // Merge, local overrides files if IDs match
                const merged = [...fileTemplates, ...localTemplates.filter(lt => !fileTemplates.some(ft => ft.id === lt.id))];
                resolve(merged);
            });
        });
    },

    /**
     * Save a single template
     * @param {Object} template 
     */
    async saveTemplate(template) {
        return new Promise((resolve) => {
            chrome.storage.local.get([StorageKeys.TEMPLATES], async (result) => {
                const templates = result[StorageKeys.TEMPLATES] || [];
                // Use loose equality for ID matching
                const index = templates.findIndex(t => t.id == template.id);

                if (index >= 0) {
                    templates[index] = template;
                } else {
                    templates.push(template);
                }

                chrome.storage.local.set({ [StorageKeys.TEMPLATES]: templates }, () => {
                    resolve(templates);
                });
            });
        });
    },

    /**
     * Delete a template by ID
     * @param {string} id 
     */
    async deleteTemplate(id) {
        return new Promise((resolve) => {
            chrome.storage.local.get([StorageKeys.TEMPLATES], (result) => {
                const templates = result[StorageKeys.TEMPLATES] || [];
                // Use loose equality to ensure we catch ID type mismatches
                const filtered = templates.filter(t => t.id != id);
                chrome.storage.local.set({ [StorageKeys.TEMPLATES]: filtered }, () => {
                    resolve(filtered);
                });
            });
        });
    },

    /**
     * Get extension configuration (Instance URL, Auth, etc)
     */
    async getConfig() {
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
    },

    /**
     * Save configuration
     * @param {Object} config 
     */
    async saveConfig(config) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [StorageKeys.CONFIG]: config }, () => {
                resolve(config);
            });
        });
    },

    /**
     * Add a ticket to session history
     * @param {Object} ticket 
     */
    async addToHistory(ticket) {
        return new Promise((resolve) => {
            chrome.storage.local.get([StorageKeys.HISTORY], (result) => {
                const history = result[StorageKeys.HISTORY] || [];
                // Add to start, keep last 50
                history.unshift({
                    ...ticket,
                    timestamp: new Date().toISOString()
                });
                const trimmed = history.slice(0, 50);
                chrome.storage.local.set({ [StorageKeys.HISTORY]: trimmed }, () => {
                    resolve(trimmed);
                });
            });
        });
    },

    /**
     * Get ticket history
     */
    async getHistory() {
        return new Promise((resolve) => {
            chrome.storage.local.get([StorageKeys.HISTORY], (result) => {
                resolve(result[StorageKeys.HISTORY] || []);
            });
        });
    },

    /**
     * Clear ticket history
     */
    async clearHistory() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [StorageKeys.HISTORY]: [] }, () => {
                resolve([]);
            });
        });
    }
};

// Export to window for popup/options to use
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
