/**
 * options.js - Logic for extension configuration page
 */

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('config-form');
    const authOptions = document.querySelectorAll('.auth-option');
    const authTypeInput = document.getElementById('authType');
    const bearerGroup = document.getElementById('auth-bearer-group');
    const basicGroup = document.getElementById('auth-basic-group');
    const statusMsg = document.getElementById('status-msg');

    // Load existing config
    const config = await StorageManager.getConfig();

    // Pre-fill form
    form.instanceUrl.value = config.instanceUrl || "";
    authTypeInput.value = config.authType || "bearer";
    form.token.value = config.token || "";
    form.username.value = config.username || "";
    form.password.value = config.password || "";

    // Set initial active auth UI
    authOptions.forEach(opt => {
        const type = opt.dataset.type;
        opt.classList.toggle('active', type === config.authType);
    });
    bearerGroup.classList.toggle('hidden', config.authType !== 'bearer');
    basicGroup.classList.toggle('hidden', config.authType !== 'basic');

    // Auth Toggling
    authOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const type = opt.dataset.type;
            authOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            authTypeInput.value = type;

            bearerGroup.classList.toggle('hidden', type !== 'bearer');
            basicGroup.classList.toggle('hidden', type !== 'basic');
        });
    });

    // Save Configuration
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newConfig = {
            instanceUrl: form.instanceUrl.value.trim(),
            authType: authTypeInput.value,
            token: form.token.value.trim(),
            username: form.username.value.trim(),
            password: form.password.value.trim()
        };

        try {
            await StorageManager.saveConfig(newConfig);
            showStatus('Configuration saved successfully!', 'success');
        } catch (err) {
            showStatus('Error saving configuration.', 'error');
        }
    });

    const showStatus = (msg, type) => {
        statusMsg.textContent = msg;
        statusMsg.style.display = 'block';
        statusMsg.style.color = type === 'success' ? '#10b981' : '#ef4444';

        setTimeout(() => {
            statusMsg.style.display = 'none';
        }, 3000);
    };
});
