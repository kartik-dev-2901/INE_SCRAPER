const { scrapeProduct } = require("./scraper/productScraper");
const { scrapeWithRetry } = require("./scraper/retry");

const {
    logScrapeAttempt,
    savePriceHistory
} = require("./db/queries");

async function test() {

    const trackedProductId = 1;

    const productUrl =
        "https://demo.inelabteamdev.com/product/300";

    const result = await scrapeWithRetry(
        () => scrapeProduct(productUrl),

        3,
        2000,

        async (attemptInfo) => {

            console.log("Saving scrape log...");

            await logScrapeAttempt(
                trackedProductId,
                attemptInfo.attempt,
                attemptInfo.status,
                attemptInfo.errorMessage,
                attemptInfo.responseTimeMs
            );
        }
    );

    if (result.success) {

        console.log("\nFINAL SCRAPE RESULT:");
        console.log(result.result);

        await savePriceHistory(
            trackedProductId,
            result.result.price,
            result.result.stockStatus,
            result.result.scrapedAt
        );

        console.log("\nPrice history saved successfully!");

    } else {

        console.log("\nSCRAPE FAILED:");
        console.log(`Attempts: ${result.attempts}`);
        console.log(`Error: ${result.error}`);
    }
}

test().catch(error => {
    console.error("\nERROR:");
    console.error(error);
});