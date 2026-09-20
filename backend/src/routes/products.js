const express = require("express");

const router = express.Router();

const CATALOG_URL =
    "https://demo.inelabteamdev.com/api/catalog?page=1&pageSize=1000";

let catalog = [];
let lastFetched = 0;

const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

async function getCatalog() {
    const now = Date.now();

    if (catalog.length > 0 && now - lastFetched < CACHE_TIME) {
        return catalog;
    }

    const response = await fetch(CATALOG_URL);

    if (!response.ok) {
        throw new Error(`Catalog request failed: ${response.status}`);
    }

    const data = await response.json();

    catalog = data.items;
    lastFetched = now;

    return catalog;
}

router.get("/search", async (req, res) => {
    try {
        const query = req.query.q?.trim().toLowerCase();

        if (!query) {
            return res.json([]);
        }

        const products = await getCatalog();

        const results = products
            .filter(product =>
                product.name.toLowerCase().includes(query)
            )
            .slice(0, 10)
            .map(product => ({
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                sku: product.sku,
                product_url:
                    `https://demo.inelabteamdev.com/product/${product.id}`
            }));

        res.json(results);

    } catch (error) {
        console.error("Product search failed:", error);

        res.status(500).json({
            error: "Failed to search products"
        });
    }
});

module.exports = router;