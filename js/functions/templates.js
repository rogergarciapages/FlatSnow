/**
 * Template Management Logic
 */

const AVAILABLE_VARIABLES = [
    { name: 'Reporter Name', id: 'contact_name' },
    { name: 'Telephone', id: 'contact_phone' },
    { name: 'Contact Source', id: 'contact_method' },
    { name: 'Short Description', id: 'short_description' },
    { name: 'Affected Device', id: 'affected_device' },
    { name: 'More Info', id: 'extra_info' },
    { name: 'Category', id: 'category' },
    { name: 'Sub-Category L1', id: 'subcategory_l1' },
    { name: 'Sub-Category L2', id: 'subcategory_l2' },
    { name: 'Affected CI', id: 'cmdb_ci' },
    { name: 'Restaurant Name', id: 'restaurant_search' }
];

async function renderTemplatesList(listContainer, onUse, onEdit, onDelete) {
    if (!listContainer) return;
    const allTemplates = await StorageManager.getTemplates();
    const templates = (allTemplates || []).filter(t => t && t.id);

    if (templates.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">No templates saved yet.</div>';
        return;
    }

    listContainer.innerHTML = templates.map(tpl => `
        <div class="template-card ${tpl.isFile ? 'file-tpl' : ''}">
            <div class="tpl-info">
                <div class="tpl-name">
                    ${tpl.name}
                    ${tpl.isFile ? '<span class="tag-file">FILE</span>' : ''}
                </div>
                <div class="tpl-desc">
                    ${Object.keys(tpl.fields || {}).length} fields pre-filled
                </div>
            </div>
            <div class="tpl-actions">
                <button class="primary-btn btn-use-tpl" data-id="${tpl.id}">Use</button>
                <div class="sub-actions">
                    <button class="secondary-btn btn-edit-tpl" data-id="${tpl.id}">Edit</button>
                    <button class="secondary-btn btn-export-tpl" data-id="${tpl.id}">Export</button>
                    <button class="secondary-btn btn-del-tpl" data-id="${tpl.id}" data-is-file="${tpl.isFile}">Delete</button>
                </div>
            </div>
        </div>
    `).join('');

    listContainer.querySelectorAll('.btn-use-tpl').forEach(btn => {
        btn.addEventListener('click', () => onUse(btn.dataset.id));
    });

    listContainer.querySelectorAll('.btn-edit-tpl').forEach(btn => {
        btn.addEventListener('click', () => onEdit(btn.dataset.id));
    });

    listContainer.querySelectorAll('.btn-export-tpl').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = templates.find(t => t.id === btn.dataset.id);
            if (tpl) exportTemplate(tpl);
        });
    });

    listContainer.querySelectorAll('.btn-del-tpl').forEach(btn => {
        btn.addEventListener('click', async () => {
            const isFile = btn.dataset.isFile === 'true';
            if (isFile) {
                alert("This template is a file. Delete it from the assets folder to remove.");
                return;
            }
            if (confirm('Delete template?')) {
                await onDelete(btn.dataset.id);
            }
        });
    });
}

async function populateTemplateSelector(selectorEl) {
    if (!selectorEl) return;
    const allTemplates = await StorageManager.getTemplates();
    const templates = (allTemplates || []).filter(t => t && t.id);

    selectorEl.innerHTML = '<option value="">Select a template...</option>';
    templates.forEach(tpl => {
        const opt = document.createElement('option');
        opt.value = tpl.id;
        opt.textContent = tpl.name;
        selectorEl.appendChild(opt);
    });
}

async function applyTemplateLogic(id, form, updateDescription, updatePreview, switchTab) {
    const templates = await StorageManager.getTemplates();
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;

    if (form) form.reset();

    const orderedKeys = [
        'category', 'subcategory_l1', 'subcategory_l2', 'cmdb_ci',
        'contact_method', 'short_description', 'rest_explanation',
        'incident_desc', 'trouble_steps', 'affected_device', 'extra_info',
        'impact', 'urgency', 'caller_id'
    ];

    orderedKeys.forEach(key => {
        if (tpl.fields[key] !== undefined && form) {
            const field = form.elements[key];
            if (field) {
                field.value = tpl.fields[key];
                field.dispatchEvent(new Event('change'));
                field.dispatchEvent(new Event('input'));
            }
        }
    });

    if (updateDescription) updateDescription();
    if (updatePreview) updatePreview();
    if (switchTab) switchTab(0);
    showToast(`Template applied!`);
}

async function editTemplateLogic(id, editorForm, editorTitle, switchTab) {
    const templates = await StorageManager.getTemplates();
    const tpl = templates.find(t => t.id === id);
    if (!tpl || !editorForm) return;

    editorForm.reset();
    const idField = document.getElementById('tpl_id');
    const nameField = document.getElementById('tpl_name');
    if (idField) idField.value = tpl.id;
    if (nameField) nameField.value = tpl.name;
    if (editorTitle) editorTitle.textContent = "Edit Template";

    Object.entries(tpl.fields).forEach(([key, value]) => {
        const fieldName = 'tpl_' + key;
        const field = editorForm.elements[fieldName] || editorForm.elements[key];
        if (field) {
            field.value = value;
            if (key === 'category' || key === 'subcategory_l1') {
                field.dispatchEvent(new Event('change'));
            }
            field.dispatchEvent(new Event('input'));
        }
    });

    if (switchTab) switchTab('create-template');
}

function exportTemplate(tpl) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tpl, null, 2));
    const downloadAnchorNode = document.createElement('a');
    const safeName = tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${safeName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

async function importTemplates(file, onDone) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const templates = Array.isArray(imported) ? imported : [imported];
            for (const tpl of templates) {
                if (!tpl.id) tpl.id = 'tpl_' + Date.now() + Math.random().toString(36).substr(2, 5);
                await StorageManager.saveTemplate(tpl);
            }
            showToast(`Imported ${templates.length} templates!`);
            if (onDone) onDone();
        } catch (err) {
            showToast("Import failed.");
        }
    };
    reader.readAsText(file);
}

function syncHighlights(textarea) {
    if (!textarea) return;
    const wrapper = textarea.closest('.rich-editor-wrapper');
    if (!wrapper) return;
    const highlightLayer = wrapper.querySelector('.rich-editor-layer');
    if (!highlightLayer) return;

    let text = textarea.value;
    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML;

    html = html.replace(/\{\{\s*([^\}]+)\s*\}\}/g, '<span class="pill-token">{{ $1 }}</span>');
    if (textarea.tagName === 'TEXTAREA') html += '\n';

    highlightLayer.innerHTML = html;
}

function setupVariableAutocomplete(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    if (!textarea.closest('.rich-editor-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'rich-editor-wrapper';
        textarea.classList.add('rich-editor-field');
        textarea.parentNode.insertBefore(wrapper, textarea);

        const highlightLayer = document.createElement('div');
        highlightLayer.className = 'rich-editor-layer';
        wrapper.appendChild(textarea);
        wrapper.appendChild(highlightLayer);
    }

    const dropdown = document.getElementById('variable-dropdown');

    textarea.addEventListener('input', () => {
        syncHighlights(textarea);
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const textBefore = text.slice(0, cursorPos);

        if (textBefore.endsWith('{{')) {
            showVariableDropdown(textarea, dropdown);
        } else if (dropdown) {
            dropdown.style.display = 'none';
        }
    });

    textarea.addEventListener('scroll', () => {
        const wrapper = textarea.closest('.rich-editor-wrapper');
        const highlightLayer = wrapper?.querySelector('.rich-editor-layer');
        if (highlightLayer) {
            highlightLayer.scrollTop = textarea.scrollTop;
            highlightLayer.scrollLeft = textarea.scrollLeft;
        }
    });

    textarea.addEventListener('keydown', (e) => {
        if (dropdown?.style.display === 'block' && e.key === 'Escape') {
            dropdown.style.display = 'none';
            e.preventDefault();
        }
    });

    syncHighlights(textarea);
}

function showVariableDropdown(textarea, dropdown) {
    if (!textarea || !dropdown) return;
    const rect = textarea.getBoundingClientRect();
    dropdown.style.top = `${rect.top + 30}px`;
    dropdown.style.left = `${rect.left + 20}px`;
    dropdown.style.display = 'block';

    dropdown.innerHTML = AVAILABLE_VARIABLES.map(v => `
        <div class="variable-item" data-name="${v.name}">${v.name}</div>
    `).join('');

    dropdown.querySelectorAll('.variable-item').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            const varName = item.dataset.name;
            const text = textarea.value;
            const cursorPos = textarea.selectionStart;
            const before = text.slice(0, cursorPos - 2);
            const after = text.slice(cursorPos);
            textarea.value = before + `{{ ${varName} }} ` + after;
            textarea.focus();
            const newPos = before.length + varName.length + 6;
            textarea.setSelectionRange(newPos, newPos);
            dropdown.style.display = 'none';
            textarea.dispatchEvent(new Event('input'));
        };
    });
}

function parseTemplateVariables(text, data = {}) {
    if (!text) return "";
    let parsed = text;
    AVAILABLE_VARIABLES.forEach(v => {
        const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'gi');
        const val = data[v.id] || `[${v.name}-NOT-SET]`;
        parsed = parsed.replace(regex, val);
    });
    return parsed;
}
