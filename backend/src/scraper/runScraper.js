const { scrapeProduct } = require("./productScraper");
const { scrapeWithRetry } = require("./retry");

const {
    getActiveTrackedProducts,
    logScrapeAttempt,
    savePriceHistory
} = require("../db/queries");


async function runScraper() {

    console.log("\n=================================");
    console.log("Starting scheduled scraper");
    console.log("=================================\n");

    const products = await getActiveTrackedProducts();

    console.log(`Found ${products.length} active products.\n`);

    for (const product of products) {

        console.log("---------------------------------");
        console.log(`Scraping: ${product.product_name}`);
        console.log(`Product ID: ${product.id}`);
        console.log(`URL: ${product.product_url}`);
        console.log("---------------------------------");

        const result = await scrapeWithRetry(
            () => scrapeProduct(product.product_url),

            3,
            2000,

            async (attemptInfo) => {

                try {

                    await logScrapeAttempt(
                        product.id,
                        attemptInfo.attempt,
                        attemptInfo.status,
                        attemptInfo.errorMessage,
                        attemptInfo.responseTimeMs
                    );

                    console.log(
                        `Scrape log saved: attempt ${attemptInfo.attempt} - ${attemptInfo.status}`
                    );

                } catch (error) {

                    console.error(
                        "Failed to save scrape log:",
                        error.message
                    );
                }
            }
        );


        if (result.success) {

            console.log(
                `\nSuccessfully scraped ${product.product_name}`
            );

            console.log(result.result);


            try {

                await savePriceHistory(
                    product.id,
                    result.result.price,
                    result.result.stockStatus,
                    result.result.scrapedAt
                );

                console.log("Price history saved.");

            } catch (error) {

                console.error(
                    "Failed to save price history:",
                    error.message
                );
            }

        } else {

            console.error(
                `\nScraping failed for ${product.product_name}`
            );

            console.error(
                `Attempts: ${result.attempts}`
            );

            console.error(
                `Error: ${result.error}`
            );
        }

        console.log("\n");
    }


    console.log("=================================");
    console.log("Scheduled scraper finished");
    console.log("=================================\n");
}

module.exports = {
    runScraper
};

if (require.main === module) {
    runScraper().catch(error => {
        console.error("\nSCRAPER RUN FAILED:");
        console.error(error);

        process.exit(1);
    });
}