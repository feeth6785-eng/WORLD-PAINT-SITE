/* ============================================================
   STOCKAGE WORLD PAINT
   APP.JS - VERSION COMPATIBLE AVEC INDEX.HTML ACTUEL
   Devise : Naira nigérian (₦)
   Langues : Français / English / Igbo
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const STORAGE_KEY = "worldPaintStockageData";

let products = [];
let productions = [];
let sales = [];
let users = [];
let historyData = [];
let salesSites = [];

let settings = {
    companyName: "World Paint",
    softwareName: "STOCKAGE World Paint",
    currency: "NGN",
    currencySymbol: "₦",
    lowStockLimit: 10,
    stockAlerts: "enabled",
    automaticCalculation: "enabled",
    lowStockNotifications: "enabled",
    outOfStockNotifications: "enabled",
    language: "fr",
    theme: "light",
    invoiceCompanyName: "World Paint",
    invoiceFooter: "Merci pour votre confiance.",
    formats: ["5", "10", "15", "20", "25", "30", "40", "50"]
};

let editingProductId = null;

let salesChart = null;
let statisticsChart = null;


/* ============================================================
   OUTILS
   ============================================================ */

function generateId(prefix = "ID") {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

function today() {
    return new Date().toISOString().split("T")[0];
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("fr-FR");
}

function formatMoney(value) {
    return (
        settings.currencySymbol +
        Number(value || 0).toLocaleString(
            "fr-FR"
        )
    );
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   SAUVEGARDE LOCALE
   ============================================================ */

function saveData() {
    const data = {
        products,
        productions,
        sales,
        users,
        historyData,
        salesSites,
        settings
    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

function loadData() {
    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        createDefaultData();
        return;
    }

    try {
        const data = JSON.parse(saved);

        products =
            Array.isArray(data.products)
                ? data.products
                : [];

        productions =
            Array.isArray(data.productions)
                ? data.productions
                : [];

        sales =
            Array.isArray(data.sales)
                ? data.sales
                : [];

        users =
            Array.isArray(data.users)
                ? data.users
                : [];

        historyData =
            Array.isArray(data.historyData)
                ? data.historyData
                : [];

        salesSites =
            Array.isArray(data.salesSites)
                ? data.salesSites
                : [];

        settings = {
            ...settings,
            ...(data.settings || {})
        };

    } catch (error) {
        console.error(
            "Erreur de lecture des données :",
            error
        );

        createDefaultData();
    }
}

function createDefaultData() {
    products = [];
    productions = [];
    sales = [];
    historyData = [];

    users = [
        {
            id: generateId("USR"),
            name: "Administrateur",
            username: "admin",
            role: "Administrateur",
            status: "Actif"
        }
    ];

    salesSites = [
        {
            id: generateId("SITE"),
            name: "Boutique principale",
            description:
                "Site de vente principal",
            status: "Actif"
        }
    ];

    saveData();
}


/* ============================================================
   HISTORIQUE
   ============================================================ */

function addHistory(
    type,
    action,
    product = "",
    quantity = 0,
    details = ""
) {
    historyData.unshift({
        id: generateId("HIS"),
        date: new Date().toLocaleString(
            "fr-FR"
        ),
        type,
        action,
        product,
        quantity,
        details
    });

    saveData();
}


/* ============================================================
   PRODUITS
   ============================================================ */

function getProduct(id) {
    return products.find(
        product => product.id === id
    );
}

function calculateProductStock(productId) {

    const product =
        getProduct(productId);

    if (!product) return 0;

    const initial =
        Number(product.initialStock || 0);

    const produced =
        productions
            .filter(
                item =>
                    item.productId === productId
            )
            .reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity || 0
                    ),
                0
            );

    const sold =
        sales
            .filter(
                item =>
                    item.productId === productId
            )
            .reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity || 0
                    ),
                0
            );

    return Math.max(
        0,
        initial + produced - sold
    );
}

function refreshProductStocks() {
    products.forEach(product => {
        product.stock =
            calculateProductStock(
                product.id
            );
    });
}

function addProductFromForm() {

    const name =
        document.getElementById(
            "productName"
        )?.value.trim();

    const reference =
        document.getElementById(
            "productReference"
        )?.value.trim();

    const type =
        document.getElementById(
            "productType"
        )?.value.trim();

    const color =
        document.getElementById(
            "productColor"
        )?.value.trim();

    const size =
        document.getElementById(
            "productSize"
        )?.value;

    const price =
        Number(
            document.getElementById(
                "productPrice"
            )?.value || 0
        );

    const initialStock =
        Number(
            document.getElementById(
                "initialStock"
            )?.value || 0
        );

    if (
        !name ||
        !reference ||
        !type ||
        !color ||
        !size
    ) {
        alert(
            "Veuillez remplir tous les champs obligatoires."
        );
        return;
    }

    if (price < 0 || initialStock < 0) {
        alert(
            "Le prix et le stock ne peuvent pas être négatifs."
        );
        return;
    }

    if (editingProductId) {

        const product =
            getProduct(
                editingProductId
            );

        if (!product) return;

        product.name = name;
        product.reference = reference;
        product.type = type;
        product.color = color;
        product.size = size;
        product.price = price;
        product.initialStock =
            initialStock;

        product.stock =
            calculateProductStock(
                product.id
            );

        addHistory(
            "Produit",
            "Modification",
            name,
            0,
            "Produit modifié."
        );

    } else {

        const duplicate =
            products.some(
                product =>
                    product.reference
                        .toLowerCase() ===
                    reference.toLowerCase()
            );

        if (duplicate) {
            alert(
                "Cette référence existe déjà."
            );
            return;
        }

        const product = {
            id: generateId("PROD"),
            name,
            reference,
            type,
            color,
            size,
            price,
            initialStock,
            stock: initialStock
        };

        products.push(product);

        addHistory(
            "Produit",
            "Ajout",
            name,
            initialStock,
            "Nouveau produit ajouté."
        );
    }

    saveData();

    closeProductModal();

    renderAll();
}

function openProductModal(productId = null) {

    editingProductId =
        productId;

    const modal =
        document.getElementById(
            "productModal"
        );

    if (!modal) return;

    const form =
        document.getElementById(
            "productForm"
        );

    if (form) form.reset();

    if (productId) {

        const product =
            getProduct(productId);

        if (!product) return;

        document.getElementById(
            "productName"
        ).value = product.name;

        document.getElementById(
            "productReference"
        ).value =
            product.reference;

        document.getElementById(
            "productType"
        ).value = product.type;

        document.getElementById(
            "productColor"
        ).value = product.color;

        document.getElementById(
            "productSize"
        ).value = product.size;

        document.getElementById(
            "productPrice"
        ).value = product.price;

        document.getElementById(
            "initialStock"
        ).value =
            product.initialStock;

        const title =
            modal.querySelector(
                ".modal-header h2"
            );

        if (title) {
            title.textContent =
                "Modifier le produit";
        }

    } else {

        const title =
            modal.querySelector(
                ".modal-header h2"
            );

        if (title) {
            title.textContent =
                "Nouveau produit";
        }
    }

    modal.classList.add(
        "active"
    );
}

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );

    if (modal) {
        modal.classList.remove(
            "active"
        );
    }

    editingProductId = null;
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {

    const product =
        getProduct(id);

    if (!product) return;

    const hasProduction =
        productions.some(
            item =>
                item.productId === id
        );

    const hasSale =
        sales.some(
            item =>
                item.productId === id
        );

    if (
        hasProduction ||
        hasSale
    ) {
        alert(
            "Impossible de supprimer ce produit car il possède déjà des opérations de production ou de vente."
        );
        return;
    }

    if (
        !confirm(
            `Voulez-vous supprimer "${product.name}" ?`
        )
    ) {
        return;
    }

    products =
        products.filter(
            item =>
                item.id !== id
        );

    addHistory(
        "Produit",
        "Suppression",
        product.name,
        0,
        "Produit supprimé."
    );

    saveData();

    renderAll();
}

function renderProducts() {

    refreshProductStocks();

    const table =
        document.getElementById(
            "productsTable"
        );

    if (!table) return;

    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-table">
                        <i class="fa-solid fa-box-open"></i>
                        <p>
                            Aucun produit enregistré.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        products.map(product => {

            const stock =
                calculateProductStock(
                    product.id
                );

            let status =
                "Stock normal";

            let className =
                "status-active";

            if (stock <= 0) {
                status =
                    "Rupture de stock";
                className =
                    "status-danger";
            } else if (
                stock <=
                Number(
                    settings.lowStockLimit
                )
            ) {
                status =
                    "Stock faible";
                className =
                    "status-warning";
            }

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            product.name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.reference
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.type
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.color
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.size
                        )} L
                    </td>

                    <td>
                        ${formatMoney(
                            product.price
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            stock
                        )}
                    </td>

                    <td>
                        <span
                            class="${className}"
                        >
                            ${status}
                        </span>

                        <div
                            style="
                                margin-top:8px;
                                display:flex;
                                gap:6px;
                            "
                        >
                            <button
                                class="secondary-btn"
                                type="button"
                                onclick="editProduct('${product.id}')"
                            >
                                Modifier
                            </button>

                            <button
                                class="settings-button danger"
                                type="button"
                                onclick="deleteProduct('${product.id}')"
                            >
                                Supprimer
                            </button>
                        </div>
                    </td>

                </tr>
            `;

        }).join("");
}


/* ============================================================
   PRODUCTION
   ============================================================ */

function addProduction() {

    if (products.length === 0) {
        alert(
            "Ajoutez d'abord un produit."
        );
        return;
    }

    const productList =
        products
            .map(
                (product, index) =>
                    `${index + 1}. ${product.name} (${product.size} L)`
            )
            .join("\n");

    const choice =
        prompt(
            "Sélectionnez le produit :\n\n" +
            productList +
            "\n\nEntrez le numéro :"
        );

    if (choice === null) return;

    const index =
        Number(choice) - 1;

    const product =
        products[index];

    if (!product) {
        alert(
            "Produit invalide."
        );
        return;
    }

    const quantity =
        Number(
            prompt(
                "Quantité produite :",
                "1"
            )
        );

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        alert(
            "Quantité invalide."
        );
        return;
    }

    const date =
        prompt(
            "Date de production :",
            today()
        ) || today();

    productions.push({
        id: generateId("PRODCT"),
        productId: product.id,
        productName: product.name,
        quantity,
        date
    });

    addHistory(
        "Production",
        "Ajout",
        product.name,
        quantity,
        "Nouvelle production enregistrée."
    );

    saveData();

    renderAll();
}

function editProduction(id) {

    const item =
        productions.find(
            production =>
                production.id === id
        );

    if (!item) return;

    const quantity =
        Number(
            prompt(
                "Nouvelle quantité :",
                item.quantity
            )
        );

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {
        alert(
            "Quantité invalide."
        );
        return;
    }

    item.quantity =
        quantity;

    addHistory(
        "Production",
        "Modification",
        item.productName,
        quantity,
        "Production modifiée."
    );

    saveData();

    renderAll();
}

function deleteProduction(id) {

    const item =
        productions.find(
            production =>
                production.id === id
        );

    if (!item) return;

    if (
        !confirm(
            "Supprimer cette production ?"
        )
    ) {
        return;
    }

    productions =
        productions.filter(
            production =>
                production.id !== id
        );

    addHistory(
        "Production",
        "Suppression",
        item.productName,
        item.quantity,
        "Production supprimée."
    );

    saveData();

    renderAll();
}

function renderProduction() {

    const table =
        document.getElementById(
            "productionTable"
        );

    if (!table) return;

    if (productions.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    Aucune production enregistrée.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        productions.map(item => {

            const product =
                getProduct(
                    item.productId
                );

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            item.date
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product
                                ? product.name
                                : item.productName
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            item.quantity
                        )}
                    </td>

                    <td>

                        <button
                            class="secondary-btn"
                            onclick="editProduction('${item.id}')"
                        >
                            Modifier
                        </button>

                        <button
                            class="settings-button danger"
                            onclick="deleteProduction('${item.id}')"
                        >
                            Supprimer
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}


/* ============================================================
   VENTES
   ============================================================ */

function addSale() {

    if (products.length === 0) {
        alert(
            "Ajoutez d'abord un produit."
        );
        return;
    }

    refreshProductStocks();

    const available =
        products.filter(
            product =>
                calculateProductStock(
                    product.id
                ) > 0
        );

    if (available.length === 0) {
        alert(
            "Aucun produit n'est actuellement disponible en stock."
        );
        return;
    }

    const productList =
        available
            .map(
                (product, index) =>
                    `${index + 1}. ${product.name} - Stock : ${calculateProductStock(product.id)}`
            )
            .join("\n");

    const choice =
        prompt(
            "Sélectionnez le produit :\n\n" +
            productList +
            "\n\nEntrez le numéro :"
        );

    if (choice === null) return;

    const product =
        available[
            Number(choice) - 1
        ];

    if (!product) {
        alert(
            "Produit invalide."
        );
        return;
    }

    const stock =
        calculateProductStock(
            product.id
        );

    const quantity =
        Number(
            prompt(
                `Quantité vendue (stock disponible : ${stock}) :`,
                "1"
            )
        );

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        alert(
            "Quantité invalide."
        );
        return;
    }

    if (quantity > stock) {
        alert(
            "Stock insuffisant."
        );
        return;
    }

    const total =
        quantity *
        Number(product.price);

    const site =
        salesSites.length > 0
            ? prompt(
                "Site de vente :",
                salesSites[0].name
            )
            : "Boutique principale";

    sales.push({
        id: generateId("SALE"),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice:
            Number(product.price),
        total,
        date: today(),
        site:
            site ||
            "Boutique principale"
    });

    addHistory(
        "Vente",
        "Ajout",
        product.name,
        quantity,
        `Vente enregistrée : ${formatMoney(total)}`
    );

    saveData();

    renderAll();
}

function editSale(id) {

    const sale =
        sales.find(
            item =>
                item.id === id
        );

    if (!sale) return;

    const product =
        getProduct(
            sale.productId
        );

    if (!product) return;

    const newQuantity =
        Number(
            prompt(
                "Nouvelle quantité vendue :",
                sale.quantity
            )
        );

    if (
        !Number.isFinite(
            newQuantity
        ) ||
        newQuantity <= 0
    ) {
        alert(
            "Quantité invalide."
        );
        return;
    }

    const currentStock =
        calculateProductStock(
            product.id
        );

    const availableAfterRemovingOld =
        currentStock +
        Number(sale.quantity);

    if (
        newQuantity >
        availableAfterRemovingOld
    ) {
        alert(
            "Stock insuffisant pour cette modification."
        );
        return;
    }

    sale.quantity =
        newQuantity;

    sale.unitPrice =
        Number(product.price);

    sale.total =
        newQuantity *
        Number(product.price);

    addHistory(
        "Vente",
        "Modification",
        product.name,
        newQuantity,
        "Vente modifiée."
    );

    saveData();

    renderAll();
}

function deleteSale(id) {

    const sale =
        sales.find(
            item =>
                item.id === id
        );

    if (!sale) return;

    if (
        !confirm(
            "Supprimer cette vente ? Le stock sera automatiquement recalculé."
        )
    ) {
        return;
    }

    const product =
        getProduct(
            sale.productId
        );

    sales =
        sales.filter(
            item =>
                item.id !== id
        );

    addHistory(
        "Vente",
        "Suppression",
        product
            ? product.name
            : sale.productName,
        sale.quantity,
        "Vente supprimée."
    );

    saveData();

    renderAll();
}

function renderSales() {

    const table =
        document.getElementById(
            "salesTable"
        );

    if (!table) return;

    if (sales.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucune vente enregistrée.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        sales.map(sale => {

            const product =
                getProduct(
                    sale.productId
                );

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            sale.date
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product
                                ? product.name
                                : sale.productName
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            sale.quantity
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            sale.unitPrice
                        )}
                    </td>

                    <td>
                        <strong>
                            ${formatMoney(
                                sale.total
                            )}
                        </strong>

                        <div
                            style="
                                margin-top:8px;
                                display:flex;
                                gap:6px;
                            "
                        >

                            <button
                                class="secondary-btn"
                                onclick="editSale('${sale.id}')"
                            >
                                Modifier
                            </button>

                            <button
                                class="settings-button danger"
                                onclick="deleteSale('${sale.id}')"
                            >
                                Supprimer
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");
}


/* ============================================================
   STOCK
   ============================================================ */

function renderStock() {

    const table =
        document.getElementById(
            "stockTable"
        );

    if (!table) return;

    refreshProductStocks();

    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    Aucun produit enregistré.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        products.map(product => {

            const production =
                productions
                    .filter(
                        item =>
                            item.productId ===
                            product.id
                    )
                    .reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                item.quantity || 0
                            ),
                        0
                    );

            const sold =
                sales
                    .filter(
                        item =>
                            item.productId ===
                            product.id
                    )
                    .reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                item.quantity || 0
                            ),
                        0
                    );

            const remaining =
                calculateProductStock(
                    product.id
                );

            let state =
                "Normal";

            if (
                remaining <= 0
            ) {
                state =
                    "Rupture";
            } else if (
                remaining <=
                Number(
                    settings.lowStockLimit
                )
            ) {
                state =
                    "Faible";
            }

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            product.name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.reference
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            product.size
                        )} L
                    </td>

                    <td>
                        ${formatNumber(
                            product.initialStock
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            production
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            sold
                        )}
                    </td>

                    <td>
                        <strong>
                            ${formatNumber(
                                remaining
                            )}
                        </strong>
                    </td>

                    <td>
                        ${state}
                    </td>

                </tr>
            `;

        }).join("");
}


/* ============================================================
   DASHBOARD
   ============================================================ */

function updateDashboard() {

    refreshProductStocks();

    const totalStock =
        products.reduce(
            (sum, product) =>
                sum +
                calculateProductStock(
                    product.id
                ),
            0
        );

    const totalProduction =
        productions.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const totalSales =
        sales.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const revenue =
        sales.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.total || 0
                ),
            0
        );

    const totalStockElement =
        document.getElementById(
            "totalStock"
        );

    const totalProductionElement =
        document.getElementById(
            "totalProduction"
        );

    const totalSalesElement =
        document.getElementById(
            "totalSales"
        );

    const totalRevenueElement =
        document.getElementById(
            "totalRevenue"
        );

    if (totalStockElement)
        totalStockElement.textContent =
            formatNumber(
                totalStock
            );

    if (totalProductionElement)
        totalProductionElement.textContent =
            formatNumber(
                totalProduction
            );

    if (totalSalesElement)
        totalSalesElement.textContent =
            formatNumber(
                totalSales
            );

    if (totalRevenueElement)
        totalRevenueElement.textContent =
            formatMoney(
                revenue
            );

    updateTopProducts();
    updateLowStock();
    updateRecentSales();
    updateSalesChart();
}


/* ============================================================
   PRODUITS LES PLUS VENDUS
   ============================================================ */

function updateTopProducts() {

    const container =
        document.getElementById(
            "topProductsList"
        );

    if (!container) return;

    const totals = {};

    sales.forEach(sale => {

        totals[sale.productId] =
            (totals[sale.productId] || 0) +
            Number(
                sale.quantity || 0
            );
    });

    const sorted =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 5);

    if (sorted.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-simple"></i>
                <p>
                    Aucune vente enregistrée.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        sorted.map(
            ([productId, quantity]) => {

                const product =
                    getProduct(
                        productId
                    );

                return `
                    <div
                        class="list-item"
                        style="
                            display:flex;
                            justify-content:space-between;
                            padding:12px 0;
                        "
                    >
                        <strong>
                            ${escapeHTML(
                                product
                                    ? product.name
                                    : "Produit"
                            )}
                        </strong>

                        <span>
                            ${formatNumber(
                                quantity
                            )} seaux
                        </span>
                    </div>
                `;
            }
        ).join("");
}


/* ============================================================
   ALERTES STOCK
   ============================================================ */

function updateLowStock() {

    const container =
        document.getElementById(
            "lowStockList"
        );

    if (!container) return;

    const low =
        products.filter(
            product =>
                calculateProductStock(
                    product.id
                ) <=
                Number(
                    settings.lowStockLimit
                )
        );

    if (low.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-check"></i>
                <p>
                    Aucun stock faible.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        low.map(product => {

            const stock =
                calculateProductStock(
                    product.id
                );

            return `
                <div
                    style="
                        padding:12px;
                        margin-bottom:8px;
                    "
                >
                    <strong>
                        ${escapeHTML(
                            product.name
                        )}
                    </strong>

                    <span>
                        Stock :
                        ${formatNumber(
                            stock
                        )}
                    </span>
                </div>
            `;

        }).join("");
}


/* ============================================================
   VENTES RÉCENTES
   ============================================================ */

function updateRecentSales() {

    const container =
        document.getElementById(
            "recentSalesList"
        );

    if (!container) return;

    const recent =
        sales.slice(0, 5);

    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-receipt"></i>
                <p>
                    Aucune vente récente.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        recent.map(sale => {

            const product =
                getProduct(
                    sale.productId
                );

            return `
                <div
                    style="
                        padding:12px 0;
                        display:flex;
                        justify-content:space-between;
                    "
                >
                    <div>
                        <strong>
                            ${escapeHTML(
                                product
                                    ? product.name
                                    : sale.productName
                            )}
                        </strong>

                        <div>
                            ${formatNumber(
                                sale.quantity
                            )} seaux
                        </div>
                    </div>

                    <strong>
                        ${formatMoney(
                            sale.total
                        )}
                    </strong>
                </div>
            `;

        }).join("");
}


/* ============================================================
   GRAPHIQUE DES VENTES
   ============================================================ */

function updateSalesChart() {

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    const canvas =
        document.getElementById(
            "salesChart"
        );

    if (!canvas) return;

    const lastDays = 7;

    const labels = [];

    const values = [];

    for (
        let i = lastDays - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const key =
            date
                .toISOString()
                .split("T")[0];

        labels.push(
            date.toLocaleDateString(
                "fr-FR",
                {
                    day: "2-digit",
                    month: "2-digit"
                }
            )
        );

        const total =
            sales
                .filter(
                    sale =>
                        sale.date ===
                        key
                )
                .reduce(
                    (sum, sale) =>
                        sum +
                        Number(
                            sale.total || 0
                        ),
                    0
                );

        values.push(total);
    }

    if (salesChart) {
        salesChart.destroy();
    }

    salesChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                "Chiffre d'affaires (₦)",
                            data: values,
                            tension: 0.3,
                            fill: false
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
}


/* ============================================================
   STATISTIQUES
   ============================================================ */

function updateStatistics() {

    const productCount =
        document.getElementById(
            "statProductCount"
        );

    const produced =
        document.getElementById(
            "statProduced"
        );

    const sold =
        document.getElementById(
            "statSold"
        );

    const revenue =
        document.getElementById(
            "statRevenue"
        );

    const totalProduced =
        productions.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const totalSold =
        sales.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const totalRevenue =
        sales.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.total || 0
                ),
            0
        );

    if (productCount)
        productCount.textContent =
            formatNumber(
                products.length
            );

    if (produced)
        produced.textContent =
            formatNumber(
                totalProduced
            );

    if (sold)
        sold.textContent =
            formatNumber(
                totalSold
            );

    if (revenue)
        revenue.textContent =
            formatMoney(
                totalRevenue
            );

    updateStatisticsSummary();
    updateStatisticsChart();
}

function updateStatisticsSummary() {

    const container =
        document.getElementById(
            "statisticsSummary"
        );

    if (!container) return;

    const stock =
        products.reduce(
            (sum, product) =>
                sum +
                calculateProductStock(
                    product.id
                ),
            0
        );

    const revenue =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.total || 0
                ),
            0
        );

    container.innerHTML = `
        <div>
            <strong>
                Stock disponible
            </strong>
            <span>
                ${formatNumber(stock)} seaux
            </span>
        </div>

        <div>
            <strong>
                Chiffre d'affaires
            </strong>
            <span>
                ${formatMoney(revenue)}
            </span>
        </div>

        <div>
            <strong>
                Nombre de produits
            </strong>
            <span>
                ${formatNumber(
                    products.length
                )}
            </span>
        </div>
    `;
}

function updateStatisticsChart() {

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    const canvas =
        document.getElementById(
            "statisticsChart"
        );

    if (!canvas) return;

    const totals = {};

    sales.forEach(sale => {

        totals[sale.productId] =
            (totals[sale.productId] || 0) +
            Number(
                sale.total || 0
            );
    });

    const labels =
        Object.keys(totals).map(
            id => {

                const product =
                    getProduct(id);

                return product
                    ? product.name
                    : "Produit";
            }
        );

    const values =
        Object.values(
            totals
        );

    if (statisticsChart) {
        statisticsChart.destroy();
    }

    statisticsChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                "Chiffre d'affaires (₦)",
                            data: values
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
}


/* ============================================================
   HISTORIQUE
   ============================================================ */

function renderHistory() {

    const table =
        document.getElementById(
            "historyTable"
        );

    if (!table) return;

    if (historyData.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun historique.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        historyData.map(item => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            item.date
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.type
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.action
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.product
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            item.quantity
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.details
                        )}
                    </td>

                </tr>
            `;

        }).join("");
}


/* ============================================================
   UTILISATEURS
   ============================================================ */

function renderUsers() {

    const table =
        document.getElementById(
            "usersTable"
        );

    if (!table) return;

    table.innerHTML =
        users.map(user => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            user.name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.username
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.role
                        )}
                    </td>

                    <td>
                        <span class="status-active">
                            ${escapeHTML(
                                user.status
                            )}
                        </span>
                    </td>

                    <td>

                        <button
                            class="secondary-btn"
                            onclick="editUser('${user.id}')"
                        >
                            Modifier
                        </button>

                        <button
                            class="settings-button danger"
                            onclick="deleteUser('${user.id}')"
                        >
                            Supprimer
                        </button>

                    </td>

                </tr>
            `;

        }).join("");
}

function addUser() {

    const name =
        prompt(
            "Nom complet :"
        );

    if (name === null) return;

    const username =
        prompt(
            "Nom d'utilisateur :"
        );

    if (username === null) return;

    const role =
        prompt(
            "Rôle :",
            "Administrateur"
        );

    if (role === null) return;

    users.push({
        id: generateId("USR"),
        name,
        username,
        role,
        status: "Actif"
    });

    addHistory(
        "Utilisateur",
        "Ajout",
        name,
        0,
        "Utilisateur ajouté."
    );

    saveData();

    renderUsers();
}

function editUser(id) {

    const user =
        users.find(
            item =>
                item.id === id
        );

    if (!user) return;

    const name =
        prompt(
            "Nom :",
            user.name
        );

    if (name === null) return;

    const username =
        prompt(
            "Nom d'utilisateur :",
            user.username
        );

    if (username === null) return;

    const role =
        prompt(
            "Rôle :",
            user.role
        );

    if (role === null) return;

    user.name = name;
    user.username = username;
    user.role = role;

    addHistory(
        "Utilisateur",
        "Modification",
        name,
        0,
        "Utilisateur modifié."
    );

    saveData();

    renderUsers();
}

function deleteUser(id) {

    const user =
        users.find(
            item =>
                item.id === id
        );

    if (!user) return;

    if (
        user.username ===
        "admin"
    ) {
        alert(
            "Le compte administrateur principal ne peut pas être supprimé."
        );
        return;
    }

    if (
        !confirm(
            `Supprimer l'utilisateur "${user.username}" ?`
        )
    ) {
        return;
    }

    users =
        users.filter(
            item =>
                item.id !== id
        );

    addHistory(
        "Utilisateur",
        "Suppression",
        user.name,
        0,
        "Utilisateur supprimé."
    );

    saveData();

    renderUsers();
}


/* ============================================================
   SITES DE VENTE
   ============================================================ */

function renderSalesSites() {

    const container =
        document.getElementById(
            "salesSitesList"
        );

    if (!container) return;

    if (salesSites.length === 0) {

        container.innerHTML =
            `<p>Aucun site de vente.</p>`;

        return;
    }

    container.innerHTML =
        salesSites.map(site => {

            return `
                <div
                    class="settings-list-item"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                site.name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                site.description
                            )}
                        </span>

                    </div>

                    <div>

                        <span class="admin-badge">
                            ${escapeHTML(
                                site.status
                            )}
                        </span>

                        <button
                            class="secondary-btn"
                            onclick="editSalesSite('${site.id}')"
                        >
                            Modifier
                        </button>

                        <button
                            class="settings-button danger"
                            onclick="deleteSalesSite('${site.id}')"
                        >
                            Supprimer
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}

function addSalesSite() {

    const name =
        prompt(
            "Nom du site de vente :"
        );

    if (
        !name ||
        !name.trim()
    ) {
        return;
    }

    const description =
        prompt(
            "Description :",
            "Site de vente"
        );

    salesSites.push({
        id: generateId("SITE"),
        name: name.trim(),
        description:
            description ||
            "Site de vente",
        status: "ACTIF"
    });

    addHistory(
        "Site",
        "Ajout",
        "",
        0,
        `Site "${name}" ajouté.`
    );

    saveData();

    renderSalesSites();
}

function editSalesSite(id) {

    const site =
        salesSites.find(
            item =>
                item.id === id
        );

    if (!site) return;

    const name =
        prompt(
            "Nom du site :",
            site.name
        );

    if (name === null) return;

    site.name =
        name.trim();

    saveData();

    renderSalesSites();
}

function deleteSalesSite(id) {

    const site =
        salesSites.find(
            item =>
                item.id === id
        );

    if (!site) return;

    if (
        !confirm(
            `Supprimer "${site.name}" ?`
        )
    ) {
        return;
    }

    salesSites =
        salesSites.filter(
            item =>
                item.id !== id
        );

    saveData();

    renderSalesSites();
}


/* ============================================================
   NAVIGATION
   ============================================================ */

const pageNames = {
    dashboard:
        "Tableau de bord",
    products:
        "Produits",
    production:
        "Production",
    sales:
        "Ventes",
    stock:
        "Stock",
    statistics:
        "Statistiques",
    history:
        "Historique",
    users:
        "Utilisateurs",
    settings:
        "Paramètres"
};

function showPage(pageId) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );
        });

    const page =
        document.getElementById(
            pageId
        );

    if (!page) return;

    page.classList.add(
        "active-page"
    );

    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(link => {

            link.classList.remove(
                "active"
            );

            if (
                link.dataset.page ===
                pageId
            ) {
                link.classList.add(
                    "active"
                );
            }
        });

    const title =
        document.getElementById(
            "pageTitle"
        );

    if (title) {
        title.textContent =
            pageNames[pageId] ||
            "STOCKAGE World Paint";
    }

    if (
        pageId ===
        "statistics"
    ) {
        updateStatistics();
    }
}


/* ============================================================
   RECHERCHE PRODUITS
   ============================================================ */

function searchProducts(value) {

    const query =
        String(value || "")
            .toLowerCase()
            .trim();

    document
        .querySelectorAll(
            "#productsTable tr"
        )
        .forEach(row => {

            row.style.display =
                row.textContent
                    .toLowerCase()
                    .includes(query)
                    ? ""
                    : "none";
        });
}


/* ============================================================
   PARAMÈTRES
   ============================================================ */

function loadSettingsIntoForm() {

    const fields = {
        companyName:
            settings.companyName,

        softwareName:
            settings.softwareName,

        currency:
            settings.currency,

        currencySymbol:
            settings.currencySymbol,

        lowStockLimit:
            settings.lowStockLimit,

        stockAlerts:
            settings.stockAlerts,

        automaticCalculation:
            settings.automaticCalculation,

        lowStockNotifications:
            settings.lowStockNotifications,

        outOfStockNotifications:
            settings.outOfStockNotifications,

        invoiceCompanyName:
            settings.invoiceCompanyName,

        invoiceFooter:
            settings.invoiceFooter,

        languageSelect:
            settings.language,

        themeMode:
            settings.theme
    };

    Object.entries(fields)
        .forEach(
            ([id, value]) => {

                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.value =
                        value;
                }
            }
        );
}

function saveSettings() {

    const get =
        id =>
            document.getElementById(
                id
            );

    settings.companyName =
        get("companyName")?.value ||
        "World Paint";

    settings.softwareName =
        get("softwareName")?.value ||
        "STOCKAGE World Paint";

    settings.currency =
        get("currency")?.value ||
        "NGN";

    settings.currencySymbol =
        get("currencySymbol")?.value ||
        "₦";

    settings.lowStockLimit =
        Number(
            get("lowStockLimit")?.value ||
            10
        );

    settings.stockAlerts =
        get("stockAlerts")?.value ||
        "enabled";

    settings.automaticCalculation =
        get("automaticCalculation")
            ?.value ||
        "enabled";

    settings.lowStockNotifications =
        get("lowStockNotifications")
            ?.value ||
        "enabled";

    settings.outOfStockNotifications =
        get("outOfStockNotifications")
            ?.value ||
        "enabled";

    settings.invoiceCompanyName =
        get("invoiceCompanyName")
            ?.value ||
        "World Paint";

    settings.invoiceFooter =
        get("invoiceFooter")
            ?.value ||
        "Merci pour votre confiance.";

    settings.language =
        get("languageSelect")
            ?.value ||
        "fr";

    settings.theme =
        get("themeMode")
            ?.value ||
        "light";

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            products,
            productions,
            sales,
            users,
            historyData,
            salesSites,
            settings
        })
    );

    applyTheme();

    translatePage(
        settings.language
    );

    alert(
        "Les paramètres ont été enregistrés avec succès."
    );
}

function applyTheme() {

    if (
        settings.theme ===
        "dark"
    ) {
        document.body.classList.add(
            "dark-mode"
        );
    } else {
        document.body.classList.remove(
            "dark-mode"
        );
    }
}


/* ============================================================
   TRADUCTION
   ============================================================ */

const translations = {

    fr: {
        dashboard:
            "Tableau de bord",
        products:
            "Produits",
        production:
            "Production",
        sales:
            "Ventes",
        stock:
            "Stock",
        statistics:
            "Statistiques",
        history:
            "Historique",
        users:
            "Utilisateurs",
        settings:
            "Paramètres",
        logout:
            "Déconnexion",

        companyInformation:
            "Informations de l'entreprise",

        companyDescription:
            "Informations générales de World Paint",

        softwareName:
            "Nom du logiciel",

        currency:
            "Devise",

        currencySymbol:
            "Symbole monétaire",

        stockManagement:
            "Gestion du stock",

        stockDescription:
            "Configuration des alertes de stock",

        lowStock:
            "Seuil de stock faible",

        stockAlerts:
            "Alertes de stock",

        financialSettings:
            "Paramètres financiers",

        financialDescription:
            "Configuration des ventes et du chiffre d'affaires",

        languageTitle:
            "Langue",

        languageDescription:
            "Choisissez la langue de l'application.",

        languageLabel:
            "Langue de l'application",

        languageHelp:
            "Le changement de langue sera automatiquement enregistré.",

        appearance:
            "Apparence",

        appearanceDescription:
            "Personnalisation de l'interface.",

        displayMode:
            "Mode d'affichage",

        lightMode:
            "Mode clair",

        darkMode:
            "Mode sombre",

        data:
            "Données",

        dataDescription:
            "Gestion des données de World Paint.",

        exportData:
            "Exporter les données",

        importData:
            "Importer une sauvegarde",

        resetData:
            "Réinitialiser les données",

        saveSettings:
            "Enregistrer les paramètres"
    },

    en: {
        dashboard:
            "Dashboard",
        products:
            "Products",
        production:
            "Production",
        sales:
            "Sales",
        stock:
            "Stock",
        statistics:
            "Statistics",
        history:
            "History",
        users:
            "Users",
        settings:
            "Settings",
        logout:
            "Logout",

        companyInformation:
            "Company Information",

        companyDescription:
            "General World Paint information",

        softwareName:
            "Software Name",

        currency:
            "Currency",

        currencySymbol:
            "Currency Symbol",

        stockManagement:
            "Stock Management",

        stockDescription:
            "Stock alert configuration",

        lowStock:
            "Low Stock Threshold",

        stockAlerts:
            "Stock Alerts",

        financialSettings:
            "Financial Settings",

        financialDescription:
            "Sales and revenue configuration",

        languageTitle:
            "Language",

        languageDescription:
            "Choose the application language.",

        languageLabel:
            "Application Language",

        languageHelp:
            "Language changes are saved automatically.",

        appearance:
            "Appearance",

        appearanceDescription:
            "Interface customization.",

        displayMode:
            "Display Mode",

        lightMode:
            "Light Mode",

        darkMode:
            "Dark Mode",

        data:
            "Data",

        dataDescription:
            "World Paint data management.",

        exportData:
            "Export Data",

        importData:
            "Import Backup",

        resetData:
            "Reset Data",

        saveSettings:
            "Save Settings"
    },

    ig: {
        dashboard:
            "Dashboard",

        products:
            "Ngwaahịa",

        production:
            "Mmepụta",

        sales:
            "Ọrịre",

        stock:
            "Ngwaahịa dị",

        statistics:
            "Ọnụọgụ",

        history:
            "Akụkọ",

        users:
            "Ndị ọrụ",

        settings:
            "Ntọala",

        logout:
            "Pụọ",

        companyInformation:
            "Ozi ụlọ ọrụ",

        companyDescription:
            "Ozi gbasara World Paint",

        softwareName:
            "Aha ngwa",

        currency:
            "Ego",

        currencySymbol:
            "Akara ego",

        stockManagement:
            "Njikwa ngwaahịa",

        stockDescription:
            "Ntọala ịdọ aka ná ntị ngwaahịa",

        lowStock:
            "Ọkwa ngwaahịa dị ala",

        stockAlerts:
            "Ịdọ aka ná ntị ngwaahịa",

        financialSettings:
            "Ntọala ego",

        financialDescription:
            "Ntọala ire ahịa na ego ụlọ ọrụ",

        languageTitle:
            "Asụsụ",

        languageDescription:
            "Họrọ asụsụ ngwa.",

        languageLabel:
            "Asụsụ ngwa",

        languageHelp:
            "A ga-echekwa mgbanwe asụsụ ozugbo.",

        appearance:
            "Ọdịdị",

        appearanceDescription:
            "Hazie ọdịdị ngwa.",

        displayMode:
            "Ụdị ngosi",

        lightMode:
            "Ụdị ìhè",

        darkMode:
            "Ụdị ọchịchịrị",

        data:
            "Data",

        dataDescription:
            "Njikwa data World Paint.",

        exportData:
            "Wepụ Data",

        importData:
            "Tinye Backup",

        resetData:
            "Malite Data Ọhụrụ",

        saveSettings:
            "Chekwaa Ntọala"
    }
};

function translatePage(language) {

    const dictionary =
        translations[
            language
        ] ||
        translations.fr;

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const key =
                element.dataset.i18n;

            if (
                dictionary[key]
            ) {
                element.textContent =
                    dictionary[key];
            }
        });
}


/* ============================================================
   EXPORT
   ============================================================ */

function exportData() {

    const data = {
        products,
        productions,
        sales,
        users,
        historyData,
        salesSites,
        settings,
        exportedAt:
            new Date().toISOString()
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download =
        "world-paint-backup.json";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    addHistory(
        "Données",
        "Export",
        "",
        0,
        "Sauvegarde exportée."
    );
}


/* ============================================================
   IMPORT
   ============================================================ */

function importData(file) {

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload =
        function(event) {

            try {

                const data =
                    JSON.parse(
                        event.target.result
                    );

                products =
                    Array.isArray(
                        data.products
                    )
                        ? data.products
                        : [];

                productions =
                    Array.isArray(
                        data.productions
                    )
                        ? data.productions
                        : [];

                sales =
                    Array.isArray(
                        data.sales
                    )
                        ? data.sales
                        : [];

                users =
                    Array.isArray(
                        data.users
                    )
                        ? data.users
                        : [];

                historyData =
                    Array.isArray(
                        data.historyData
                    )
                        ? data.historyData
                        : [];

                salesSites =
                    Array.isArray(
                        data.salesSites
                    )
                        ? data.salesSites
                        : [];

                settings = {
                    ...settings,
                    ...(data.settings || {})
                };

                saveData();

                renderAll();

                loadSettingsIntoForm();

                alert(
                    "Sauvegarde importée avec succès."
                );

            } catch(error) {

                console.error(
                    error
                );

                alert(
                    "Le fichier sélectionné n'est pas une sauvegarde valide."
                );
            }
        };

    reader.readAsText(
        file
    );
}


/* ============================================================
   RÉINITIALISATION
   ============================================================ */

function resetData() {

    const confirmation =
        confirm(
            "ATTENTION : toutes les données du logiciel seront supprimées. Continuer ?"
        );

    if (!confirmation)
        return;

    localStorage.removeItem(
        STORAGE_KEY
    );

    createDefaultData();

    renderAll();

    loadSettingsIntoForm();

    alert(
        "Les données ont été réinitialisées."
    );
}


/* ============================================================
   BOUTONS ET ÉVÉNEMENTS
   ============================================================ */

function setupEvents() {

    /* Navigation */

    document
        .querySelectorAll(
            ".nav-link[data-page]"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    showPage(
                        this.dataset.page
                    );
                }
            );
        });


    /* Nouveau produit */

    document
        .getElementById(
            "addProductBtn"
        )
        ?.addEventListener(
            "click",
            () =>
                openProductModal()
        );

    document
        .getElementById(
            "addProductBtn2"
        )
        ?.addEventListener(
            "click",
            () =>
                openProductModal()
        );


    /* Formulaire produit */

    document
        .getElementById(
            "productForm"
        )
        ?.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                addProductFromForm();
            }
        );


    /* Fermer modal */

    document
        .querySelectorAll(
            ".close-modal"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeProductModal
            );
        });


    /* Clic sur fond du modal */

    document
        .getElementById(
            "productModal"
        )
        ?.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    this
                ) {
                    closeProductModal();
                }
            }
        );


    /* Nouvelle production */

    document
        .getElementById(
            "addProductionBtn"
        )
        ?.addEventListener(
            "click",
            addProduction
        );


    /* Nouvelle vente */

    document
        .getElementById(
            "addSaleBtn"
        )
        ?.addEventListener(
            "click",
            addSale
        );


    /* Vente rapide */

    document
        .getElementById(
            "quickSaleBtn"
        )
        ?.addEventListener(
            "click",
            function() {

                showPage("sales");

                setTimeout(
                    addSale,
                    100
                );
            }
        );


    /* Ajouter utilisateur */

    document
        .getElementById(
            "addUserBtn"
        )
        ?.addEventListener(
            "click",
            addUser
        );


    /* Site de vente */

    document
        .getElementById(
            "addSalesSiteBtn"
        )
        ?.addEventListener(
            "click",
            addSalesSite
        );


    /* Recherche */

    document
        .getElementById(
            "productSearch"
        )
        ?.addEventListener(
            "input",
            function() {

                searchProducts(
                    this.value
                );
            }
        );


    /* Langue */

    document
        .getElementById(
            "languageSelect"
        )
        ?.addEventListener(
            "change",
            function() {

                settings.language =
                    this.value;

                saveData();

                translatePage(
                    this.value
                );
            }
        );


    /* Thème */

    document
        .getElementById(
            "themeMode"
        )
        ?.addEventListener(
            "change",
            function() {

                settings.theme =
                    this.value;

                saveData();

                applyTheme();
            }
        );


    /* Sauvegarde paramètres */

    document
        .getElementById(
            "saveSettingsBtn"
        )
        ?.addEventListener(
            "click",
            saveSettings
        );


    /* Export */

    document
        .getElementById(
            "exportDataBtn"
        )
        ?.addEventListener(
            "click",
            exportData
        );


    /* Import */

    document
        .getElementById(
            "importDataInput"
        )
        ?.addEventListener(
            "change",
            function() {

                if (
                    this.files &&
                    this.files[0]
                ) {
                    importData(
                        this.files[0]
                    );
                }

                this.value = "";
            }
        );


    /* Réinitialisation */

    document
        .getElementById(
            "resetDataBtn"
        )
        ?.addEventListener(
            "click",
            resetData
        );


    /* Gestion utilisateurs */

    document
        .getElementById(
            "manageUsersBtn"
        )
        ?.addEventListener(
            "click",
            function() {

                showPage("users");
            }
        );


    /* Changement mot de passe */

    document
        .getElementById(
            "changePasswordBtn"
        )
        ?.addEventListener(
            "click",
            function() {

                alert(
                    "La gestion sécurisée du mot de passe sera disponible avec le système de connexion complet."
                );
            }
        );


    /* Menu mobile */

    document
        .querySelector(
            ".mobile-menu"
        )
        ?.addEventListener(
            "click",
            function() {

                document
                    .querySelector(
                        ".sidebar"
                    )
                    ?.classList.toggle(
                        "open"
                    );
            }
        );


    /* Déconnexion */

    document
        .querySelector(
            ".logout-btn"
        )
        ?.addEventListener(
            "click",
            function() {

                if (
                    confirm(
                        "Voulez-vous vraiment vous déconnecter ?"
                    )
                ) {

                    window.location.href =
                        "login.html";
                }
            }
        );


    /* Notification */

    document
        .querySelector(
            ".notification-btn"
        )
        ?.addEventListener(
            "click",
            function() {

                updateLowStock();

                alert(
                    "Consultez la section « Alertes de stock » sur le tableau de bord."
                );
            }
        );
}


/* ============================================================
   RENDU GLOBAL
   ============================================================ */

function renderAll() {

    refreshProductStocks();

    renderProducts();

    renderProduction();

    renderSales();

    renderStock();

    renderHistory();

    renderUsers();

    renderSalesSites();

    updateDashboard();

    updateStatistics();

    loadSettingsIntoForm();

    translatePage(
        settings.language
    );

    applyTheme();
}


/* ============================================================
   INITIALISATION
   ============================================================ */

function init() {

    console.log(
        "STOCKAGE World Paint - démarrage..."
    );

    loadData();

    setupEvents();

    renderAll();

    showPage(
        "dashboard"
    );

    console.log(
        "STOCKAGE World Paint - prêt."
    );
}


/* ============================================================
   DÉMARRAGE
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}


/* ============================================================
   FONCTIONS ACCESSIBLES DEPUIS LE HTML
   ============================================================ */

window.showPage =
    showPage;

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.addProduction =
    addProduction;

window.editProduction =
    editProduction;

window.deleteProduction =
    deleteProduction;

window.addSale =
    addSale;

window.editSale =
    editSale;

window.deleteSale =
    deleteSale;

window.editUser =
    editUser;

window.deleteUser =
    deleteUser;

window.editSalesSite =
    editSalesSite;

window.deleteSalesSite =
    deleteSalesSite;

window.searchProducts =
    searchProducts;