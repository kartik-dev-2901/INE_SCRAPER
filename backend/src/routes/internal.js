const express = require("express");
const { runScraper } = require("../scraper/runScraper");

const router = express.Router();

router.post("/scrape", async (req, res) => {
    try {
        const secret = req.headers["x-scraper-secret"];

        if (!secret || secret !== process.env.SCRAPER_SECRET) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        // Start the scraper and wait for it to finish.
        await runScraper();

        res.json({
            success: true,
            message: "Scraper run completed"
        });

    } catch (error) {
        console.error("Scheduled scraper failed:", error);

        res.status(500).json({
            success: false,
            error: "Scraper run failed"
        });
    }
});

module.exports = router;