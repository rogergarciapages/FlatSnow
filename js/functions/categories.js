/**
 * Categorization Logic
 */

let categoriesData = [];

function setupCategorization(catId, l1Id, l2Id, ciId, updatePreviewCallback) {
    const catEl = document.getElementById(catId);
    const l1El = document.getElementById(l1Id);
    const l2El = document.getElementById(l2Id);
    const ciEl = document.getElementById(ciId);

    function populateCats() {
        if (!categoriesData.length) return;
        const uniqueCats = [...new Set(categoriesData.map(item => item.Category))].sort();
        catEl.innerHTML = '<option value="">---</option>';
        uniqueCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catEl.appendChild(opt);
        });
    }

    catEl.addEventListener('change', () => {
        const selectedCat = catEl.value;
        l1El.innerHTML = '<option value="">---</option>';
        l2El.innerHTML = '<option value="">---</option>';
        ciEl.value = '';

        if (!selectedCat) return;

        const filteredL1 = [...new Set(categoriesData
            .filter(item => item.Category === selectedCat)
            .map(item => item["Sub-Category L1"]))].sort();

        filteredL1.forEach(l1 => {
            const opt = document.createElement('option');
            opt.value = l1;
            opt.textContent = l1;
            l1El.appendChild(opt);
        });
        if (updatePreviewCallback) updatePreviewCallback();
    });

    l1El.addEventListener('change', () => {
        const selectedCat = catEl.value;
        const selectedL1 = l1El.value;
        l2El.innerHTML = '<option value="">---</option>';
        ciEl.value = '';

        if (!selectedL1) return;

        const filteredL2 = [...new Set(categoriesData
            .filter(item => item.Category === selectedCat && item["Sub-Category L1"] === selectedL1)
            .map(item => item["Sub-Category L2"]))].sort();

        filteredL2.forEach(l2 => {
            const opt = document.createElement('option');
            opt.value = l2;
            opt.textContent = l2;
            l2El.appendChild(opt);
        });
        if (updatePreviewCallback) updatePreviewCallback();
    });

    l2El.addEventListener('change', () => {
        const selectedCat = catEl.value;
        const selectedL1 = l1El.value;
        const selectedL2 = l2El.value;

        if (!selectedL2) {
            ciEl.value = '';
        } else {
            const match = categoriesData.find(item =>
                item.Category === selectedCat &&
                item["Sub-Category L1"] === selectedL1 &&
                item["Sub-Category L2"] === selectedL2
            );
            ciEl.value = match ? match["Affected CI"] : '';
        }
        if (updatePreviewCallback) updatePreviewCallback();
    });

    return populateCats;
}

async function loadCategories(onDone) {
    try {
        const response = await fetch('assets/constants/Categories.json');
        categoriesData = await response.json();
        if (onDone) onDone();
    } catch (err) {
        console.error("Failed to load categories:", err);
    }
}
