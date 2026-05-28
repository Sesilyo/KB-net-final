// FILENAME: scripts/components/injectTransactions.js
// Fetches and renders transaction cards for both borrower and lender views.

function formatDateTime(dt) {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('en-PH', {
        year:   'numeric',
        month:  'short',
        day:    'numeric',
        hour:   '2-digit',
        minute: '2-digit'
    });
}

function toDateTimeLocal(dt) {
    if (!dt) return '';
    return dt.replace(' ', 'T').slice(0, 16);
}

function borrowerView(tx) {
    const statusClass = tx.status?.toLowerCase() ?? 'active';

    return `
    <p class="tx-counterpart">Lender: ${tx.lender_name ?? '-'}</p>
    <p><strong>Start:</strong>       ${formatDateTime(tx.start_date)}</p>
    <p><strong>End:</strong>         ${formatDateTime(tx.end_date)}</p>
    <p><strong>Returned:</strong>    ${formatDateTime(tx.returned_date)}</p>
    <p><strong>Total Cost:</strong>  ₱${Number(tx.total_cost).toFixed(2)}</p>
    <p><strong>Notes:</strong>       ${tx.notes ?? '-'}</p>
    <span class="tx-status-label ${statusClass}">${tx.status ?? '-'}</span>`;
}

function lenderEditForm(tx) {
    return `
    <p class="tx-counterpart">Borrower: ${tx.borrower_name ?? '-'}</p>
    <p><strong>Total Cost:</strong>  ₱${Number(tx.total_cost).toFixed(2)}</p>
    <label class="tx-info-label">Start Date
        <input class="tx-start" type="datetime-local"
            value="${toDateTimeLocal(tx.start_date)}">
    </label>
    <label class="tx-info-label">End Date
        <input class="tx-end" type="datetime-local"
            value="${toDateTimeLocal(tx.end_date)}">
    </label>
    <label class="tx-info-label">Returned Date
        <input class="tx-returned-date" type="datetime-local"
            value="${toDateTimeLocal(tx.returned_date)}">
    </label>
    <label class="tx-info-label tx-returned-label">
        <input class="tx-returned" type="checkbox"
            ${tx.is_returned ? 'checked' : ''}>
        Mark as Returned
    </label>
    <label class="tx-info-label">Notes
        <textarea class="tx-notes">${tx.notes ?? ''}</textarea>
    </label>
    <button class="tx-save-btn" data-id="${tx.transaction_id}">
        Save changes
    </button>`;
}

function createTransactionCard(tx, role) {
    const isLender = role === 'lender';
    const imgSrc   = tx.image_path ? `../${tx.image_path}` : '';
    return `
    <div class="transaction-card" data-id="${tx.transaction_id}">
        <div class="tx-image-wrap">
            <img src="${imgSrc}" alt="${tx.item_name}"
                onerror="this.style.display='none'">
        </div>
        <div class="tx-info">
            <h3>${tx.item_name}</h3>
            <p class="tx-category">${tx.category_name}</p>
            <p class="tx-id">Transaction ID: ${tx.transaction_id}</p>
            <p class="tx-price">₱${tx.price_pr_hr}/hr</p>
            ${isLender ? lenderEditForm(tx) : borrowerView(tx)}
        </div>
    </div>`;
}

async function saveTransaction(card) {
    const btn = card.querySelector('.tx-save-btn');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    const returnedRaw = card.querySelector('.tx-returned-date').value;

    const payload = {
        transaction_id: card.dataset.id,
        start_date:     card.querySelector('.tx-start').value.replace('T', ' ') || null,
        end_date:       card.querySelector('.tx-end').value.replace('T', ' ')   || null,
        returned_date:  returnedRaw ? returnedRaw.replace('T', ' ') : null,
        is_returned:    card.querySelector('.tx-returned').checked ? 1 : 0,
        notes:          card.querySelector('.tx-notes').value,
    };

    try {
        const res = await fetch('../api/updateTransaction.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });

        if (!res.ok) {
            const raw = await res.text();
            console.error(`HTTP ${res.status} from updateTransaction.php:`, raw);
            alert(`Server error (${res.status}). Check the console for details.`);
            return;
        }

        const data = await res.json();
        if (data.success) {
            alert('Transaction updated!');
        } else {
            alert(`Save failed: ${data.message ?? 'Please try again.'}`);
        }
    } catch (err) {
        console.error('saveTransaction error:', err);
        alert('Network error. Please check your connection and try again.');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Save changes';
    }
}

// statusFilter: '' | 'active' | 'returned'
async function injectTransactions(containerId, role, statusFilter = '') {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p class="tx-loading">Loading transactions…</p>';

    const endpoint = role === 'lender'
        ? '../api/getMyLends.php'
        : '../api/getMyBorrows.php';

    const params = new URLSearchParams();
    if (statusFilter !== '') params.set('status', statusFilter);

    try {
        const res  = await fetch(`${endpoint}?${params}`);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML =
                `<p class="tx-error">${data.message ?? 'Failed to load transactions.'}</p>`;
            return;
        }

        const transactions = data.data ?? [];
        container.innerHTML = transactions.length
            ? transactions.map(tx => createTransactionCard(tx, role)).join('')
            : '<p class="tx-empty">No transactions found.</p>';

        container.querySelectorAll('.tx-save-btn').forEach(btn => {
            btn.addEventListener('click', () => saveTransaction(btn.closest('.transaction-card')));
        });

    } catch (err) {
        console.error('injectTransactions error:', err);
        container.innerHTML =
            '<p class="tx-error">Could not load transactions. Please try again.</p>';
    }
}

export { injectTransactions };