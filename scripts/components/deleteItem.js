// FILENAME: scripts/components/deleteItem.js

import { injectMyItems } from './injectMyItems.js';

// ── Module-level state ────────────────────────────────────────────────────────
let currentItemId = null;

// ── Inject modal from popup HTML ──────────────────────────────────────────────
async function injectModal() {
    if (document.getElementById('delete-item-modal')) return;

    let html;
    try {
        const res = await fetch('./popups/deleteitem_popup.html');
        if (!res.ok) throw new Error(`Failed to fetch modal: ${res.status}`);
        html = await res.text();
    } catch (err) {
        console.error('injectModal (delete) error:', err);
        return;
    }

    const modal          = document.createElement('div');
    modal.id             = 'delete-item-modal';
    modal.style.display  = 'none';
    modal.style.position = 'fixed';
    modal.style.inset    = '0';
    modal.style.zIndex   = '100';
    modal.innerHTML      = html;
    document.body.appendChild(modal);
}

// ── Open modal ────────────────────────────────────────────────────────────────
function openModal(itemId) {
    currentItemId = itemId;
    const msg = document.getElementById('delete-item-msg');
    msg.style.color = '';
    msg.textContent = '';
    document.getElementById('btn-delete-confirm').disabled = false;
    document.getElementById('btn-delete-confirm').textContent = 'Delete';
    document.getElementById('delete-item-modal').style.display = 'block';
}

// ── Close and reset ───────────────────────────────────────────────────────────
function closeModal() {
    currentItemId = null;
    document.getElementById('delete-item-modal').style.display = 'none';
    document.getElementById('delete-item-msg').textContent = '';
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleDeleteItem() {
    const btn = document.getElementById('btn-delete-confirm');
    const msg = document.getElementById('delete-item-msg');

    if (!currentItemId) {
        msg.style.color = 'red';
        msg.textContent = 'Item ID is missing. Please close and try again.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Deleting...';

    try {
        const res  = await fetch('../api/deleteItem.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ item_id: parseInt(currentItemId) }),
        });

        if (res.status === 401) {
            window.location.href = '../pages/login_signup.html';
            return;
        }

        const data = await res.json();

        if (data.success) {
            msg.style.color = 'green';
            msg.textContent = 'Item deleted successfully!';
            setTimeout(() => {
                closeModal();
                injectMyItems('#item-grid');
            }, 800);
        } else {
            msg.style.color = 'red';
            msg.textContent = data.message || 'Something went wrong.';
            btn.disabled    = false;
            btn.textContent = 'Delete';
        }
    } catch (err) {
        console.error('Delete item error:', err);
        msg.style.color = 'red';
        msg.textContent = 'Something went wrong. Check the console.';
        btn.disabled    = false;
        btn.textContent = 'Delete';
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initDeleteItem() {
    await injectModal();

    if (!document.getElementById('delete-item-modal')) {
        console.error('Delete item modal not found — check popups/deleteitem_popup.html path');
        return;
    }

    document.getElementById('delete-item-close')
        .addEventListener('click', closeModal);
    document.getElementById('delete-item-overlay')
        .addEventListener('click', closeModal);
    document.getElementById('btn-delete-cancel')
        .addEventListener('click', closeModal);
    document.getElementById('btn-delete-confirm')
        .addEventListener('click', handleDeleteItem);

    document.addEventListener('open-delete-modal', (e) => {
        openModal(e.detail.itemId);
    });
}