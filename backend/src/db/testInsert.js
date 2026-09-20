const {
    logScrapeAttempt,
    savePriceHistory
} = require("./queries");

async function test() {
    const trackedProductId = 1;

    const log = await logScrapeAttempt(
        trackedProductId,
        1,
        "success",
        null,
        2500
    );

    console.log("Scrape log inserted:");
    console.log(log);

    const history = await savePriceHistory(
        trackedProductId,
        5315,
        "OUT OF STOCK",
        new Date().toISOString()
    );

    console.log("Price history inserted:");
    console.log(history);
}

test().catch(error => {
    console.error("Database insert failed:");
    console.error(error);
});