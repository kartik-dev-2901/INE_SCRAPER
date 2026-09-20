async function scrapeWithRetry(
    scrapeFunction,
    maxAttempts = 3,
    delayMs = 2000,
    onAttempt = null
) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\n--- Scrape attempt ${attempt}/${maxAttempts} ---`);

        const startTime = Date.now();

        try {
            const result = await scrapeFunction();

            const responseTimeMs = Date.now() - startTime;

            console.log(`Attempt ${attempt} succeeded`);

            if (onAttempt) {
                await onAttempt({
                    attempt,
                    status: "success",
                    errorMessage: null,
                    responseTimeMs
                });
            }

            return {
                success: true,
                attempt,
                result
            };

        } catch (error) {
            const responseTimeMs = Date.now() - startTime;

            lastError = error;

            console.log(`Attempt ${attempt} failed: ${error.message}`);

            if (onAttempt) {
                await onAttempt({
                    attempt,
                    status: attempt < maxAttempts ? "retried" : "failed",
                    errorMessage: error.message,
                    responseTimeMs
                });
            }

            if (attempt < maxAttempts) {
                console.log(`Waiting ${delayMs}ms before retry...`);

                await new Promise(resolve =>
                    setTimeout(resolve, delayMs)
                );
            }
        }
    }

    return {
        success: false,
        attempts: maxAttempts,
        error: lastError?.message || "Unknown error"
    };
}

module.exports = {
    scrapeWithRetry
};