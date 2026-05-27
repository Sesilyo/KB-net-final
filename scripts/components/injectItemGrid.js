// FILENAME: injectItemGrid.js

function createItemCard(item, currentLenderId = null) {
    const imageBlock = item.image_path
        ? `<img class="item-img" src="../${item.image_path}" alt="${item.item_name}" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'item-img item-img-placeholder'}))">`
        : `<div class="item-img item-img-placeholder"></div>`;

    const isAvailable   = item.item_status === 'available';
    const isOwner       = currentLenderId && item.lender_id === currentLenderId;

    let borrowBtn;
    if (isOwner) {
        borrowBtn = `<button class = "borrow-btn" disabled>Your Item</button>`;
    } else if (!isAvailable) {
        borrowBtn = `<button class = "borrow-btn" disabled>Unavailable</button>`;
    } else {
        borrowBtn = `<button class = "borrow-btn" data-id="${item.item_id}">Borrow</button>`
    }
                        
    return `
        <div class="item-card" data-id="${item.item_id}">
            <span class="item-status ${item.item_status.toLowerCase()}">${item.item_status}</span>
            ${imageBlock}
            <div class="item-info">
                <div class="item-body">
                    <div class="item-labels">
                        <p class="item-name">${item.item_name}</p>
                        <span class="item-category">${item.category_name}</span>
                    </div>

                    <span class="item-price">₱${parseFloat(item.price_pr_hr).toFixed(2)} / hr</span>
                </div>
                
                <div class="item-footer">
                    <p class="item-lender">${item.first_name} ${item.last_name}</p>
                    ${borrowBtn}
                </div>
            </div>
        </div>
    `;
}

export async function injectItemGrid(containerId, categories = [], statuses = [], search='') {
    const params = new URLSearchParams();
    if (categories.length) params.append('categories', categories.join(','));
    if (statuses.length) params.append('statuses', statuses.join(','));
    if (search) params.append('search', search);

    const res = await fetch(`../api/getItems.php?${params}`);
    const items = await res.json();

    const container = document.querySelector(containerId);
    container.innerHTML = items.map(createItemCard).join('');
}