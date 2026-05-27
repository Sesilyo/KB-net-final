// FILENAME: injectNavBar.js

export async function loadNavbar() {
    const navbar = `
        <nav id="main-nav-bar">
            <h1>KB-Net</h1>
            <ul>
                <li><a href="../pages/browse.html">Browse</a></li>
                <li><a href="../pages/transaction.html">Transactions</a></li>
                <li><a href="../pages/my_items.html">My Items</a></li>
                <li><a href="../pages/profile.html">Profile</a></li>
            </ul>
        </nav>
    `;

    document.querySelector("header").innerHTML = navbar;

    const links = document.querySelectorAll("#main-nav-bar a");
    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });
}