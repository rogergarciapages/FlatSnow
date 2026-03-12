/**
 * History Management Logic
 */

async function renderHistoryList(listContainer) {
    const allHistory = await StorageManager.getHistory();
    const history = (allHistory || []).filter(item => item && item.incident_number);

    if (history.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">No history recorded in this session.</div>';
        return;
    }

    listContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="item-id">${item.incident_number}</div>
            <div class="item-info">
                <div class="item-title">${item.short_description}</div>
                <div class="item-meta">
                    <span class="badge ${item.status.toLowerCase()}">${item.status}</span>
                    <span>${new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
            <button class="copy-inc" data-id="${item.incident_number}">Copy</button>
        </div>
    `).join('');

    listContainer.querySelectorAll('.copy-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(btn.dataset.id).then(() => {
                showToast('Incident number copied!');
            });
        });
    });
}
