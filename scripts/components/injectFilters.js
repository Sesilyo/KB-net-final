// FILENAME: injectFilters.js

export async function injectFilters() {

    // fetching category IDs
    const catRes = await fetch('../api/getCategories.php');
    const categories = await catRes.json();

    // fetching distinct availability labels
    const availRes = await fetch('../api/getAvailabilities.php');
    const availabilities = await availRes.json();

    const filterContainer = document.querySelector('#filter-container');
    filterContainer.innerHTML = categories.map( cat => `
            <label>
                <input type="checkbox" value="${cat.category_id}" class="filter-category">
                ${cat.category_name}
            </label>
        `).join('');

    const availabilityContainer = document.querySelector('#availability-filter-container');
    availabilityContainer.innerHTML = availabilities.map ( avail => `
            <label>
                <input type="checkbox" value="${avail.item_status}" class="filter-availability">
                ${avail.item_status}
            </label>
        `).join('');

}