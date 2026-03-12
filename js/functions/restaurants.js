/**
 * Restaurant Search Logic
 */

let restaurants = [];

async function loadRestaurants(onDone) {
    try {
        const response = await fetch('assets/constants/Restaurants.json');
        const data = await response.json();
        restaurants = data.map(item => ({
            id: item["1"],
            name: item["Bruxelles Bourse RestNbr 1"],
            phone: item["+32 2 513 42 13"]
        }));
        if (onDone) onDone();
    } catch (err) {
        console.error("Failed to load restaurants:", err);
    }
}

let highlightedIndex = -1;

function setupRestaurantSearch(searchInput, hiddenInput, resultsBox, onSelect) {
    let currentResults = [];

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            resultsBox.style.display = 'none';
            highlightedIndex = -1;
            return;
        }

        currentResults = restaurants.filter(r =>
            r.id.toLowerCase().includes(query) ||
            r.name.toLowerCase().includes(query)
        ).slice(0, 10);

        highlightedIndex = -1; // Reset on new search
        renderRestaurantResults(currentResults, resultsBox, searchInput, hiddenInput, onSelect);
    });

    searchInput.addEventListener('keydown', (e) => {
        const items = resultsBox.querySelectorAll('.autocomplete-item');
        if (resultsBox.style.display === 'none' || !items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % items.length;
            updateHighlights(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
            updateHighlights(items);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (highlightedIndex > -1) {
                e.preventDefault();
                items[highlightedIndex].click();
            }
        }
    });

    function updateHighlights(items) {
        items.forEach((item, index) => {
            if (index === highlightedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.style.display = 'none';
        }
    });
}

function renderRestaurantResults(items, resultsBox, searchInput, hiddenInput, onSelect) {
    if (items.length === 0) {
        resultsBox.style.display = 'none';
        return;
    }

    resultsBox.innerHTML = items.map(item => `
        <div class="autocomplete-item" data-id="${item.id}" data-name="${item.name}" data-phone="${item.phone || ''}">
            <span class="name">${item.name}</span>
            <span class="code">${item.id}</span>
        </div>
    `).join('');
    resultsBox.style.display = 'block';

    resultsBox.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', () => {
            searchInput.value = el.dataset.name;
            hiddenInput.value = el.dataset.id;
            resultsBox.style.display = 'none';
            if (onSelect) onSelect(el.dataset.id, el.dataset.name, el.dataset.phone);
        });
    });
}
