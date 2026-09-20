const express = require("express");
const { runScraper } = require("../scraper/runScraper");

const router = express.Router();

let scraperRunning = false;

router.post("/scrape", async (req, res) => {
    const secret = req.headers["x-scraper-secret"];

    if (!secret || secret !== process.env.SCRAPER_SECRET) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    if (scraperRunning) {
        return res.status(409).json({
            success: false,
            message: "Scraper is already running"
        });
    }

    scraperRunning = true;

    runScraper()
        .then(() => {
            console.log("Background scraper completed");
        })
        .catch(error => {
            console.error("Background scraper failed:", error);
        })
        .finally(() => {
            scraperRunning = false;
        });

    return res.status(202).json({
        success: true,
        message: "Scraper started"
    });
});

module.exports = router;