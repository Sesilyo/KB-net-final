// FILENAME: scripts/components/edittem.js

import { injectMyItems } from './injectMyItems.js';

// ── Module-level state ────────────────────────────────────────────────────────
let currentItemId = null;

// ── Inject modal from popup HTML ──────────────────────────────────────────────
async function injectModal() {
    if (document.getElementById('edit-item-modal')) return;

    let html;
    try {
        const res = await fetch('./popups/edititem_popup.html');
        if (!res.ok) throw new Error(`Failed to fetch modal: ${res.status}`);
        html = await res.text();
    } catch (err) {
        console.error('injectModal (edit) error:', err);
        return;
    }

    const modal          = document.createElement('div');
    modal.id             = 'edit-item-modal';
    modal.style.display  = 'none';
    modal.style.position = 'fixed';
    modal.style.inset    = '0';
    modal.style.zIndex   = '100';
    modal.innerHTML      = html;
    document.body.appendChild(modal);
}

// ── Populate category dropdown ────────────────────────────────────────────────
async function loadCategories(selectedId = '') {
    const res        = await fetch('../api/getCategories.php');
    const categories = await res.json();

    const select     = document.getElementById('edit-item-category');
    select.innerHTML = '<option value="" disabled>Select a category</option>'
        + categories.map(cat =>
            `<option value="${cat.category_id}" ${String(cat.category_id) === String(selectedId) ? 'selected' : ''}>${cat.category_name}</option>`
        ).join('');
}

// ── Open modal and populate with item data ────────────────────────────────────
async function openModal(itemId) {
    const modal = document.getElementById('edit-item-modal');
    const msg   = document.getElementById('edit-item-msg');
    const btn   = document.getElementById('btn-edit-item');

    msg.style.color = '#888';
    msg.textContent = 'Loading item data...';
    btn.disabled    = true;

    modal.style.display = 'block';

    try {
        const res = await fetch(`../api/getItem.php?item_id=${itemId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const item = await res.json();

        if (!item || item.error) {
            msg.style.color = 'red';
            msg.textContent = item?.error || 'Failed to load item.';
            return;
        }

        currentItemId = item.item_id;

        document.getElementById('edit-item-name').value   = item.item_name        || '';
        document.getElementById('edit-item-desc').value   = item.item_description || '';
        document.getElementById('edit-item-price').value  = item.price_pr_hr      ?? '';
        const rawStatus = (item.item_status || 'available').toLowerCase();
        const statusMap = { available: 'Available', borrowed: 'Borrowed', unavailable: 'Unavailable' };
        document.getElementById('edit-item-status').value = statusMap[rawStatus] || 'Available';
        document.getElementById('edit-item-image').value  = '';

        const imgEl   = document.getElementById('edit-item-current-img');
        const noImgEl = document.getElementById('edit-item-no-img');

        if (item.image_path) {
            imgEl.src             = '../' + item.image_path;
            imgEl.style.display   = 'block';
            noImgEl.style.display = 'none';
        } else {
            imgEl.style.display   = 'none';
            noImgEl.style.display = 'inline';
        }

        await loadCategories(item.category_id);

        msg.textContent = '';
        btn.disabled    = false;

    } catch (err) {
        console.error('openModal error:', err);
        msg.style.color = 'red';
        msg.textContent = 'Could not load item data.';
    }
}

// ── Close and reset ───────────────────────────────────────────────────────────
function closeModal() {
    currentItemId = null;
    document.getElementById('edit-item-modal').style.display = 'none';
    document.getElementById('edit-item-msg').textContent     = '';
    document.getElementById('edit-item-name').value          = '';
    document.getElementById('edit-item-desc').value          = '';
    document.getElementById('edit-item-price').value         = '';
    document.getElementById('edit-item-image').value         = '';

    const imgEl   = document.getElementById('edit-item-current-img');
    const noImgEl = document.getElementById('edit-item-no-img');
    imgEl.src             = '';
    imgEl.style.display   = 'none';
    noImgEl.style.display = 'inline';
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleEditItem() {
    const btn = document.getElementById('btn-edit-item');
    const msg = document.getElementById('edit-item-msg');

    if (!currentItemId) {
        msg.style.color = 'red';
        msg.textContent = 'Item ID is missing. Please close and reopen the editor.';
        return;
    }

    const item_name        = document.getElementById('edit-item-name').value.trim();
    const item_description = document.getElementById('edit-item-desc').value.trim();
    const item_status      = document.getElementById('edit-item-status').value;
    const price_pr_hr      = document.getElementById('edit-item-price').value.trim();
    const category_id      = document.getElementById('edit-item-category').value;
    const imageFile        = document.getElementById('edit-item-image').files[0];

    msg.style.color = 'red';
    msg.textContent = '';

    if (!item_name)                         { msg.textContent = 'Item name is required.';      return; }
    if (!category_id)                       { msg.textContent = 'Please select a category.';   return; }
    if (!price_pr_hr || isNaN(price_pr_hr)) { msg.textContent = 'Please enter a valid price.'; return; }
    if (parseFloat(price_pr_hr) < 0)        { msg.textContent = 'Price cannot be negative.';   return; }

    const formData = new FormData();
    formData.append('item_id',          currentItemId);
    formData.append('item_name',        item_name);
    formData.append('item_description', item_description);
    formData.append('item_status',      item_status);
    formData.append('price_pr_hr',      price_pr_hr);
    formData.append('category_id',      category_id);
    if (imageFile) formData.append('image', imageFile);

    btn.disabled    = true;
    btn.textContent = 'Saving...';

    try {
        const res  = await fetch('../api/editItem.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.status === 401) {
            window.location.href = '../pages/login_signup.html';
            return;
        }

        if (data.success) {
            msg.style.color = 'green';
            msg.textContent = 'Item updated successfully!';
            setTimeout(() => {
                closeModal();
                injectMyItems('#item-grid');
            }, 800);
        } else {
            msg.textContent = data.message || 'Something went wrong.';
        }
    } catch (err) {
        console.error('Edit item error:', err);
        msg.textContent = 'Something went wrong. Check the console.';
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Save Changes';
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initEditItem() {
    await injectModal();

    if (!document.getElementById('edit-item-modal')) {
        console.error('Edit item modal not found — check popups/edititem_popup.html path');
        return;
    }

    document.getElementById('edit-item-close')
        .addEventListener('click', closeModal);
    document.getElementById('edit-item-overlay')
        .addEventListener('click', closeModal);
    document.getElementById('btn-edit-item')
        .addEventListener('click', handleEditItem);

    document.addEventListener('open-edit-modal', (e) => {
        openModal(e.detail.itemId);
    });
}