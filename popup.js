/**
 * popup.js - Main Entry Point for SNOW Quick Ticket
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load HTML Components
    try {
        await Promise.all([
            loadComponent('comp-new-ticket', 'components/new_ticket.html'),
            loadComponent('comp-templates', 'components/template_manager.html'),
        ]);

        const mainContent = document.getElementById('main-content');
        if (mainContent && !document.getElementById('comp-history')) {
            const historyComp = document.createElement('div');
            historyComp.id = 'comp-history';
            mainContent.appendChild(historyComp);
        }
        await loadComponent('comp-history', 'components/history.html');
    } catch (err) {
        console.error("Component loading failed:", err);
    }

    // 2. DOM Elements Reference
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    const form = document.getElementById('ticket-form');
    const btnSubmit = document.getElementById('btn-submit');
    const btnApply = document.getElementById('btn-apply');
    const btnClear = document.getElementById('btn-clear-form');
    const btnCopyJson = document.getElementById('btn-copy-json');
    const jsonPreview = document.getElementById('json-preview');
    const templateSelect = document.getElementById('template-select');
    const contactMethodSelect = document.getElementById('contact_method');
    const impactSelect = document.getElementById('impact');
    const urgencySelect = document.getElementById('urgency');
    const restaurantSearchInput = document.getElementById('restaurant_search');
    const restaurantHiddenInput = document.getElementById('u_restaurant');
    const restaurantResults = document.getElementById('restaurant_results');
    const btnNewTemplate = document.getElementById('btn-new-template');
    const btnCancelTemplate = document.getElementById('btn-cancel-template');
    const templateEditorForm = document.getElementById('template-editor-form');
    const templateEditorTitle = document.getElementById('template-editor-title');
    const tabCreateTemplate = document.querySelector('.tab-btn[data-tab="create-template"]');
    const btnOptions = document.getElementById('btn-options');
    const descriptionSync = document.getElementById('description');

    let currentTask = {};

    // 3. Logic Modules
    const updatePreview = () => {
        if (!form) return;
        const fd = new FormData(form);
        const rawData = {};
        fd.forEach((value, key) => rawData[key] = value);

        if (restaurantSearchInput) rawData['restaurant_search'] = restaurantSearchInput.value;

        const parsedData = {};
        Object.entries(rawData).forEach(([key, value]) => {
            if (typeof value === 'string' && value.includes('{{') && typeof parseTemplateVariables === 'function') {
                parsedData[key] = parseTemplateVariables(value, rawData);
            } else {
                parsedData[key] = value;
            }
        });

        if (jsonPreview) jsonPreview.textContent = JSON.stringify(parsedData, null, 2);
        currentTask = parsedData;
    };

    const updateDescription = () => {
        if (!form) return;
        const rawData = {};
        new FormData(form).forEach((value, key) => rawData[key] = value);

        if (restaurantSearchInput) rawData['restaurant_search'] = restaurantSearchInput.value;
        ['contact_name', 'contact_phone', 'affected_device', 'extra_info', 'rest_explanation', 'incident_desc', 'trouble_steps'].forEach(id => {
            const el = document.getElementById(id);
            if (el) rawData[id] = el.value;
        });

        const timestamp = new Date().toLocaleString('fr-BE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        if (typeof parseTemplateVariables !== 'function') return;

        const parsedIncident = parseTemplateVariables(rawData['incident_desc'] || "", rawData);
        const parsedExplanation = parseTemplateVariables(rawData['rest_explanation'] || "", rawData);
        const parsedTrouble = parseTemplateVariables(rawData['trouble_steps'] || "", rawData);

        const template = `Restaurant: ${rawData['restaurant_search'] || "[search-restaurant]"}
Nom du contact: ${rawData['contact_name'] || "[enter-caller-name]"}
Numéro de téléphone: ${rawData['contact_phone'] || "[restaurant-phone-missing]"}
Disponibilité: n/a

Description: ${parsedIncident}

Explication fournie par le restaurant: ${parsedExplanation}
Étapes de dépannage effectuées par le restaurant: ${parsedTrouble}
Horodatage du problème: ${timestamp}
Nom et numéro de l'appareil affecté: ${rawData['affected_device'] || "[device-name-or-number]"}
Message d'erreur / Capture d'écran: n/a
Informations supplémentaires pertinentes: ${rawData['extra_info'] || "[no-extra-info]"}`;

        if (descriptionSync) descriptionSync.value = template;
        updatePreview();
    };

    const switchTab = (target) => {
        let tabToClick;
        if (typeof target === 'number') { tabToClick = tabs[target]; }
        else { tabToClick = Array.from(tabs).find(t => t.dataset.tab === target); }
        if (tabToClick) tabToClick.click();
    };

    const refreshTemplates = async () => {
        const listContainer = document.getElementById('templates-list');
        if (!listContainer || typeof renderTemplatesList !== 'function') return;
        await renderTemplatesList(listContainer,
            (id) => applyTemplateLogic(id, form, updateDescription, updatePreview, switchTab),
            (id) => editTemplateLogic(id, templateEditorForm, templateEditorTitle, switchTab),
            async (id) => {
                await StorageManager.deleteTemplate(id);
                showToast("Deleted!");
                refreshTemplates();
                if (typeof populateTemplateSelector === 'function') populateTemplateSelector(templateSelect);
            }
        );
    };

    // 4. Bind Events
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panes.forEach(p => {
                p.classList.remove('active');
                if (p.id === `tab-${target}`) p.classList.add('active');
            });
            if (target === 'templates') refreshTemplates();
            if (target === 'history' && typeof renderHistoryList === 'function') renderHistoryList(document.getElementById('history-list'));
        });
    });

    // Sub-modules Init
    if (typeof setupCategorization === 'function') {
        const popMain = setupCategorization('category', 'subcategory_l1', 'subcategory_l2', 'cmdb_ci', updatePreview);
        const popTpl = setupCategorization('tpl_category', 'tpl_subcategory_l1', 'tpl_subcategory_l2', 'tpl_cmdb_ci');
        if (typeof loadCategories === 'function') loadCategories(() => {
            if (popMain) popMain();
            if (popTpl) popTpl();
        });
    }

    if (typeof loadRestaurants === 'function') {
        loadRestaurants(() => {
            if (typeof setupRestaurantSearch === 'function') {
                setupRestaurantSearch(restaurantSearchInput, restaurantHiddenInput, restaurantResults, (id, name, phone) => {
                    if (phone && document.getElementById('contact_phone')) document.getElementById('contact_phone').value = phone;
                    updateDescription();
                    const next = document.getElementById('contact_name');
                    if (next) next.focus();
                });
            }
        });
    }

    if (form) form.addEventListener('input', updatePreview);
    document.querySelectorAll('.desc-trigger').forEach(trigger => trigger.addEventListener('input', updateDescription));

    if (contactMethodSelect) contactMethodSelect.addEventListener('change', () => {
        const m = contactMethodSelect.value;
        if (impactSelect && urgencySelect) {
            impactSelect.value = (m === 'self') ? '4' : '3';
            urgencySelect.value = (m === 'self') ? '4' : '3';
        }
        updatePreview();
    });

    if (btnClear) btnClear.addEventListener('click', () => {
        if (form) form.reset();
        if (restaurantSearchInput) restaurantSearchInput.value = '';
        if (restaurantHiddenInput) restaurantHiddenInput.value = '';
        document.querySelectorAll('.desc-trigger').forEach(i => i.value = '');
        updateDescription();
        updatePreview();
    });

    if (btnCopyJson) btnCopyJson.addEventListener('click', () => {
        if (jsonPreview) navigator.clipboard.writeText(jsonPreview.textContent).then(() => showToast('Copied!'));
    });

    if (btnSubmit) btnSubmit.addEventListener('click', async () => {
        updateDescription();
        if (form && !form.checkValidity()) { form.reportValidity(); return; }
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Submitting...';
        chrome.runtime.sendMessage({ type: 'SUBMIT_TICKET', payload: currentTask }, (res) => {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Submit to SNOW';
            if (res && res.success) {
                showToast(`Success! ${res.incident_number}`);
                StorageManager.addToHistory({
                    incident_number: res.incident_number,
                    short_description: currentTask.short_description,
                    status: 'Created'
                });
            } else {
                showToast(`Error: ${res?.error || 'Unknown'}`);
            }
        });
    });

    if (btnApply) btnApply.addEventListener('click', () => {
        updateDescription();
        chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
            if (t[0]) {
                chrome.tabs.sendMessage(t[0].id, { type: 'FILL_SNOW_FORM', payload: currentTask }, (res) => {
                    if (chrome.runtime.lastError) showToast("Content script not found. Refresh SNOW page.");
                    else if (res && res.success) showToast("Applied!");
                });
            }
        });
    });

    if (templateSelect) templateSelect.addEventListener('change', (e) => {
        if (e.target.value && typeof applyTemplateLogic === 'function') applyTemplateLogic(e.target.value, form, updateDescription, updatePreview);
    });

    if (btnNewTemplate) btnNewTemplate.addEventListener('click', () => {
        if (templateEditorForm) templateEditorForm.reset();
        const tid = document.getElementById('tpl_id');
        if (tid) tid.value = '';
        if (templateEditorTitle) templateEditorTitle.textContent = "Create New Template";
        ['tpl_short_description', 'tpl_incident_desc', 'tpl_trouble_steps'].forEach(id => {
            const el = document.getElementById(id);
            if (el && typeof syncHighlights === 'function') syncHighlights(el);
        });
        if (tabCreateTemplate) tabCreateTemplate.click();
    });

    if (btnCancelTemplate) btnCancelTemplate.addEventListener('click', () => switchTab('templates'));

    if (templateEditorForm) templateEditorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(templateEditorForm);
        const name = fd.get('tpl_name');
        const eid = fd.get('tpl_id');
        const fields = {};
        fd.forEach((val, key) => {
            if (key.startsWith('tpl_') && key !== 'tpl_id' && key !== 'tpl_name' && val) {
                fields[key.replace('tpl_', '')] = val;
            } else if (!key.startsWith('tpl_') && val) {
                fields[key] = val;
            }
        });
        await StorageManager.saveTemplate({ id: eid || ('tpl_' + Date.now()), name: name, color: '#038d8d', fields: fields });
        showToast("Saved!");
        if (typeof populateTemplateSelector === 'function') populateTemplateSelector(templateSelect);
        switchTab('templates');
    });

    if (btnOptions) btnOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());

    document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
        if (confirm('Clear history?')) {
            await StorageManager.clearHistory();
            if (typeof renderHistoryList === 'function') renderHistoryList(document.getElementById('history-list'));
        }
    });

    // Autocomplete Setup
    ['tpl_incident_desc', 'tpl_trouble_steps', 'tpl_short_description', 'incident_desc', 'trouble_steps', 'short_description', 'rest_explanation'].forEach(id => {
        if (typeof setupVariableAutocomplete === 'function') setupVariableAutocomplete(id);
    });

    // Final Init
    if (typeof populateTemplateSelector === 'function') populateTemplateSelector(templateSelect);
    updateDescription();
});
