const express = require("express");

const {
    addTrackedProduct,
    getTrackedProducts,
    getPriceHistory,
    getScrapeLogs
} = require("../db/queries");

const router = express.Router();


// GET /api/tracked-products
router.get("/", async (req, res) => {
    try {
        const products = await getTrackedProducts();

        res.json(products);
    } catch (error) {
        console.error("Failed to get tracked products:", error);

        res.status(500).json({
            error: "Failed to get tracked products"
        });
    }
});


// POST /api/tracked-products
router.post("/", async (req, res) => {
    try {
        const {
            external_id,
            product_name,
            product_url,
            sku
        } = req.body;

        // Basic validation
        if (!external_id || !product_name || !product_url) {
            return res.status(400).json({
                error: "external_id, product_name and product_url are required"
            });
        }

        const result = await addTrackedProduct({
            external_id,
            product_name,
            product_url,
            sku
        });

        if (result.alreadyTracked) {
            return res.status(409).json({
                error: "Product is already being tracked",
                product: result.product
            });
        }

        res.status(201).json(result.product);

    } catch (error) {
        console.error("Failed to track product:", error);

        res.status(500).json({
            error: "Failed to track product"
        });
    }
});

router.get("/:id/history", async (req, res) => {
    try {
        const history = await getPriceHistory(req.params.id);

        res.json(history);
    } catch (error) {
        console.error("Failed to get price history:", error);

        res.status(500).json({
            error: "Failed to get price history"
        });
    }
});


router.get("/:id/logs", async (req, res) => {
    try {
        const logs = await getScrapeLogs(req.params.id);

        res.json(logs);
    } catch (error) {
        console.error("Failed to get scrape logs:", error);

        res.status(500).json({
            error: "Failed to get scrape logs"
        });
    }
});
module.exports = router;