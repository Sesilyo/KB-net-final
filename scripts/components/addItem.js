// FILENAME: scripts/components/addItem.js

import { injectMyItems } from './injectMyItems.js';

// ── Inject FAB ────────────────────────────────────────────────────────────────
function injectFAB() {
    if (document.getElementById('add-item-btn')) return;

    const btn       = document.createElement('button');
    btn.id          = 'add-item-btn';
    btn.textContent = '+ Add Item';
    document.body.appendChild(btn);
}

// ── Inject modal from popup HTML file ────────────────────────────────────────
async function injectModal() {
    if (document.getElementById('add-item-modal')) return;

    let html;
    try {
        const res = await fetch('./popups/addItem_popup.html');
        if (!res.ok) throw new Error(`Failed to fetch modal: ${res.status}`);
        html = await res.text();
    } catch (err) {
        console.error('injectModal error:', err);
        return;
    }

    const modal          = document.createElement('div');
    modal.id             = 'add-item-modal';
    modal.style.display  = 'none';
    modal.style.position = 'fixed';
    modal.style.inset    = '0';
    modal.style.zIndex   = '100';
    modal.innerHTML      = html;
    document.body.appendChild(modal);
}

// ── Populate category dropdown ────────────────────────────────────────────────
async function loadCategories() {
    const res        = await fetch('../api/getCategories.php');
    const categories = await res.json();

    const select     = document.getElementById('add-item-category');
    select.innerHTML = '<option value="" disabled selected>Select a category</option>'
        + categories.map(cat =>
            `<option value="${cat.category_id}">${cat.category_name}</option>`
        ).join('');
}

// ── Open / close ──────────────────────────────────────────────────────────────
function openModal() {
    document.getElementById('add-item-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('add-item-modal').style.display = 'none';
    document.getElementById('add-item-msg').textContent = '';
    document.getElementById('add-item-name').value      = '';
    document.getElementById('add-item-desc').value      = '';
    document.getElementById('add-item-price').value     = '';
    document.getElementById('add-item-category').value  = '';
    document.getElementById('add-item-status').value    = 'Available';
    document.getElementById('add-item-image').value     = '';
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleAddItem() {
    const item_name        = document.getElementById('add-item-name').value.trim();
    const item_description = document.getElementById('add-item-desc').value.trim();
    const item_status      = document.getElementById('add-item-status').value;
    const price_pr_hr      = document.getElementById('add-item-price').value.trim();
    const category_id      = document.getElementById('add-item-category').value;
    const imageFile        = document.getElementById('add-item-image').files[0];
    const msg              = document.getElementById('add-item-msg');

    msg.style.color = 'red';
    msg.textContent = '';

    if (!item_name)                         { msg.textContent = 'Item name is required.';      return; }
    if (!category_id)                       { msg.textContent = 'Please select a category.';   return; }
    if (!price_pr_hr || isNaN(price_pr_hr)) { msg.textContent = 'Please enter a valid price.'; return; }
    if (parseFloat(price_pr_hr) < 0)        { msg.textContent = 'Price cannot be negative.';   return; }

    const formData = new FormData();
    formData.append('item_name',        item_name);
    formData.append('item_description', item_description);
    formData.append('item_status',      item_status);
    formData.append('price_pr_hr',      price_pr_hr);
    formData.append('category_id',      category_id);
    if (imageFile) formData.append('image', imageFile);

    const submitBtn       = document.getElementById('btn-add-item');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Adding...';

    try {
        const res  = await fetch('../api/addItem.php', { method: 'POST', body: formData });
        const data = await res.json();

        if (res.status === 401) {
            window.location.href = '../pages/login_signup.html';
            return;
        }

        if (data.success) {
            msg.style.color = 'green';
            msg.textContent = 'Item added successfully!';
            setTimeout(() => {
                closeModal();
                injectMyItems('#item-grid');
            }, 800);
        } else {
            msg.textContent = data.message || 'Something went wrong.';
        }
    } catch (err) {
        console.error('Add item error:', err);
        msg.textContent = 'Something went wrong. Check the console.';
    } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Add Item';
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initAddItem() {
    injectFAB();
    await injectModal();

    // If modal failed to load, abort
    if (!document.getElementById('add-item-modal')) {
        console.error('Add item modal not found — check popups/addItem_popup.html path');
        return;
    }

    await loadCategories();

    document.getElementById('add-item-btn')
        .addEventListener('click', openModal);
    document.getElementById('add-item-close')
        .addEventListener('click', closeModal);
    document.getElementById('add-item-overlay')
        .addEventListener('click', closeModal);
    document.getElementById('btn-add-item')
        .addEventListener('click', handleAddItem);
}