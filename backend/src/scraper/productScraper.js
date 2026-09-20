const { chromium } = require("playwright");


function parsePrice(value) {
    let number = value
        .replace(/[₹$]/g, "")
        .replace(/Rs\.?/gi, "")
        .replace(/[\s\u00A0]/g, "")
        .trim();

    // 17.636,00 -> 17636.00
    if (number.includes(",") && number.includes(".")) {

        const lastComma = number.lastIndexOf(",");
        const lastDot = number.lastIndexOf(".");

        if (lastComma > lastDot) {

            number = number
                .replace(/\./g, "")
                .replace(",", ".");

        } else {

            // 5,129.00 -> 5129.00
            number = number.replace(/,/g, "");
        }

    } else {

        // 5,129 -> 5129
        number = number.replace(/,/g, "");
    }

    return Number(number);
}

async function handleCookieOverlay(page) {
    const overlay = page.locator(".cookie-overlay");

    try {
        await overlay.waitFor({
            state: "visible",
            timeout: 5000
        });

        console.log("Cookie overlay found");

        const acceptButton = overlay.getByRole(
            "button",
            { name: "Accept cookies" }
        );

        if (await acceptButton.count() > 0) {
            await acceptButton.click();

            console.log("Cookies accepted");

            await overlay.waitFor({
                state: "hidden",
                timeout: 5000
            });

            console.log("Cookie overlay removed");
        }

    } catch {
        console.log("No cookie overlay found");
    }
}
async function scrapeProduct(productUrl) {

    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage({
        viewport: {
            width: 1280,
            height: 900
        }
    });


    let priceRequestSeen = false;
    let priceResponseStatus = null;


    page.on("request", request => {

        const url = request.url();

        if (
            url.includes("/api/") &&
            (
                url.includes("/product/") ||
                url.includes("/challenge") ||
                url.includes("/session") ||
                url.includes("/price")
            )
        ) {
            console.log(
                `REQUEST: ${request.method()} ${url}`
            );
        }

        if (url.includes("/api/products/") && url.includes("/price")) {
            priceRequestSeen = true;
        }
    });


    page.on("response", response => {

        const url = response.url();

        if (
            url.includes("/api/") &&
            (
                url.includes("/product/") ||
                url.includes("/challenge") ||
                url.includes("/session") ||
                url.includes("/price")
            )
        ) {
            console.log(
                `RESPONSE: ${response.status()} ${url}`
            );
        }

        if (url.includes("/api/products/") && url.includes("/price")) {
            priceResponseStatus = response.status();
        }
    });


    try {

        await page.goto(productUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        console.log("Page loaded");


        // Handle cookie popup if it appears
        await handleCookieOverlay(page);


        // Find reveal button
        const revealButton = page.getByRole(
            "button",
            {
                name: /reveal price/i
            }
        );


        console.log(
            `Reveal button count: ${await revealButton.count()}`
        );


        if (await revealButton.count() === 0) {

            throw new Error(
                "Reveal price button not found"
            );
        }


        // Mouse movements appear to be part of the
        // mock store's anti-bot interaction flow.
        console.log("Performing mouse movements...");

        const box = await revealButton.boundingBox();

        if (box) {

            for (let i = 0; i < 12; i++) {

                const x =
                    box.x +
                    box.width *
                    (0.35 + (i % 4) * 0.1);

                const y =
                    box.y +
                    box.height *
                    (0.35 + (i % 3) * 0.15);

                await page.mouse.move(x, y);

                await page.waitForTimeout(60);
            }
        }


        await page.waitForTimeout(1000);


        // Cookie overlay can appear again
        // after mouse interaction.
        await handleCookieOverlay(page);


        const isEnabled =
            await revealButton.isEnabled();


        console.log(
            `Reveal button enabled: ${isEnabled}`
        );


        if (!isEnabled) {

            throw new Error(
                "Reveal price button is still disabled"
            );
        }


        console.log("Clicking Reveal price...");

        await revealButton.click();


        console.log("Waiting for price to appear...");


        // The site can retry the price API internally,
        // so we wait for rendered price text instead
        // of waiting for one particular API response.
        await page.waitForFunction(() => {

            const element =
                document.querySelector(".price-main");

            if (!element) {
                return false;
            }

            const text =
                element.innerText || element.textContent || "";

            return /₹\s*[\d.,]+|Rs\.?\s*[\d.,]+/i.test(
                text
            );

        }, {
            timeout: 30000
        });


        console.log(
            `Price request seen: ${priceRequestSeen}`
        );

        console.log(
            `Price response status: ${priceResponseStatus}`
        );


        // -----------------------------------------
        // PRICE
        // -----------------------------------------

        const priceElement =
            page.locator(".price-main");


        let priceText =
            await priceElement.innerText();


        // Remove zero-width Unicode characters
        // sometimes inserted between digits.
        priceText = priceText.replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
        );


        console.log("\nPRICE TEXT:");
        console.log(priceText);


        const priceMatches =
            priceText.match(
                /₹\s*[\d.,]+|Rs\.?\s*[\d.,]+/gi
            );


        if (
            !priceMatches ||
            priceMatches.length === 0
        ) {

            throw new Error(
                "Could not find price on product page"
            );
        }


        // The final price is normally the last
        // monetary value shown in the price area.
        const priceValue =
            priceMatches[priceMatches.length - 1];


        const price =
            parsePrice(priceValue);


        if (!Number.isFinite(price)) {

            throw new Error(
                `Invalid price detected: ${priceValue}`
            );
        }


        console.log(
            `Detected price: ${price}`
        );


        // -----------------------------------------
        // STOCK
        // -----------------------------------------

        const stockElement =
            page.locator(".stock-badge");


        let stockStatus =
            "UNKNOWN";


        if (await stockElement.count() > 0) {

            stockStatus =
                (
                    await stockElement.innerText()
                ).trim();
        }


        // -----------------------------------------
        // PRODUCT NAME
        // -----------------------------------------

        const productName =
            (
                await page.locator("h1").first().innerText()
            ).trim();


        // -----------------------------------------
        // SKU
        // -----------------------------------------

        const bodyText =
            await page.locator("body").innerText();


        const skuMatch =
            bodyText.match(
                /SKU\s+([A-Z0-9-]+)/i
            );


        const sku =
            skuMatch
                ? skuMatch[1]
                : null;


        // -----------------------------------------
        // RESULT
        // -----------------------------------------

        const productIdMatch =
            productUrl.match(
                /\/product\/(\d+)/
            );


        const productId =
            productIdMatch
                ? Number(productIdMatch[1])
                : null;


        await browser.close();


        return {

            productId,

            productName,

            sku,

            price,

            stockStatus,

            scrapedAt:
                new Date().toISOString()
        };


    } catch (error) {

        await browser.close();

        throw error;
    }
}


module.exports = {
    scrapeProduct
};