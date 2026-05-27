// FILENAME: injectItemModal.js
// opens a modal when user clicks borrow on item card
// fetches full item details, lets user pick start/end datetime
// auto-calculates total cost, confirms borrow


// calculate total cost from start, end, priceperhr
// difference between two objects is ms so we divide down to hrs
function calculateTotal(startVal, endVal, pricePerHr) {
    if (!startVal || !endVal) return '0.00';
    const start     = new Date(startVal);
    const end       = new Date(endVal);
    const hours     = Math.max( (end - start) / (1000 * 60 * 60), 0);
    return (hours * pricePerHr).toFixed(2);
}

// render modal content
function renderModal(item) {
    const modal = document.getElementById('item-modal');

    modal.innerHTML = `
    <button class="modal-close-btn" id="modal-close">✕</button>

    <div class="modal-image-wrap">
        <img src="../${item.image_path}" alt="${item.item_name}"
            onerror="this.style.display='none'">
    </div>

    <div class="modal-info">
        <p class="modal-category">${item.category_name}</p>
        <h2>${item.item_name}</h2>
        <p class="modal-description">${item.item_description ?? '-'}</p>
        <p class="modal-lender">Lender: ${item.first_name} ${item.last_name}</p>
        <p class="modal-price">₱${parseFloat(item.price_pr_hr).toFixed(2)}/hr</p>

        <div class="modal-form">
            <label class="modal-label">Start Date & Time
                <input class="modal-start" type="datetime-local">
            </label>

            <label class="modal-label">End Date & Time
                <input class="modal-end" type="datetime-local">
            </label>

            <p class="modal-total">
                Estimated Total: <strong id="modal-total-value">₱0.00</strong>
            </p>
            <p class="modal-error hidden" id="modal-error"></p>
            <button class="modal-confirm-btn" id="modal-confirm"
                    data-item-id="${item.item_id}"
                    data-price="${item.price_pr_hr}">
                Confirm
            </button>
        </div>
    </div>`;

    const startInput = modal.querySelector('.modal-start');
    const endInput   = modal.querySelector('.modal-end');
    const totalLabel = document.getElementById('modal-total-value');

    function updateTotal() {
        totalLabel.textContent = `₱${calculateTotal(startInput.value, endInput.value, item.price_pr_hr)}`;
    }

    startInput.addEventListener('change', updateTotal);
    endInput.addEventListener('change', updateTotal);

    document.getElementById('modal-close').addEventListener('click', closeModal);

    document.getElementById('modal-confirm').addEventListener('click', async () => {
        const errorEl = document.getElementById('modal-error');
        errorEl.classList.add('hidden');
        errorEl.textContent = '';

        const start = startInput.value.replace('T', ' ');
        const end   = endInput.value.replace('T', ' ');

        if (!startInput.value || !endInput.value) {
            errorEl.textContent = 'Please select a start and end date.';
            errorEl.classList.remove('hidden');
            return;
        }

        if (new Date(endInput.value) <= new Date(startInput.value)) {
            errorEl.textContent = 'End date must be after start date.';
            errorEl.classList.remove('hidden');
            return;
        }

        const confirmBtn       = document.getElementById('modal-confirm');
        confirmBtn.disabled    = true;
        confirmBtn.textContent = 'Processing...';

        try {
            const res  = await fetch('../api/addTransaction.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    item_id:    item.item_id,
                    start_date: start,
                    end_date:   end,
                }),
            });

            const data = await res.json();

            if (data.success) {
                closeModal();
                const { injectItemGrid } = await import('./injectItemGrid.js');
                injectItemGrid('#item-grid');
            } else {
                errorEl.textContent    = data.message ?? 'Something went wrong.';
                errorEl.classList.remove('hidden');
                confirmBtn.disabled    = false;
                confirmBtn.textContent = 'Confirm';
            }
        } catch (err) {
            console.error('addTransaction error:', err);
            errorEl.textContent    = 'Network error. Please try again.';
            errorEl.classList.remove('hidden');
            confirmBtn.disabled    = false;
            confirmBtn.textContent = 'Confirm';
        }
    });
}

// open modal : fetches item data then renders
async function openItemModal(itemId) {
    const overlay = document.getElementById('item-modal-overlay');
    const modal   = document.getElementById('item-modal');

    overlay.classList.remove('hidden');
    modal.innerHTML = '<p class="modal-loading">Loading…</p>';

    try {
        const res  = await fetch(`../api/getItem.php?item_id=${itemId}`);
        const item = await res.json();

        if (item.error) {
            modal.innerHTML = `<p class="modal-error">${item.error}</p>`;
            return;
        }

        renderModal(item);
    } catch (err) {
        console.error('openItemModal error:', err);
        modal.innerHTML = '<p class="modal-error">Failed to load item. Please try again.</p>';
    }
}

// close modal : hides overlay and clears content
function closeModal() {
    document.getElementById('item-modal-overlay').classList.add('hidden');
    document.getElementById('item-modal').innerHTML = '';
}

// ensures clicking inside card doesn't automatically close it
document.getElementById('item-modal-overlay')
    ?.addEventListener('click', (e) => {
        if (e.target.id === 'item-modal-overlay') closeModal();
    });

export { openItemModal };