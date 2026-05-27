// FILENAME: injectItemGrid.js

function createItemCard(item) {
    const imageBlock = item.image_path
        ? `<img class="item-img" src="../${item.image_path}" alt="${item.item_name}" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'item-img item-img-placeholder'}))">`
        : `<div class="item-img item-img-placeholder"></div>`;

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
                    <button class="borrow-btn">Borrow</button>
                </div>
            </div>
        </div>
    `;
}

export async function injectItemGrid(containerId, categories = [], statuses = []) {
    const params = new URLSearchParams();
    if (categories.length) params.append('categories', categories.join(','));
    if (statuses.length) params.append('statuses', statuses.join(','));

    const res = await fetch(`../api/getItems.php?${params}`);
    const items = await res.json();

    const container = document.querySelector(containerId);
    container.innerHTML = items.map(createItemCard).join('');
}