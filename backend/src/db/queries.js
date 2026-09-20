const supabase = require("./supabase");

async function logScrapeAttempt(
    trackedProductId,
    attemptNumber,
    status,
    errorMessage = null,
    responseTimeMs = null
) {
    const { data, error } = await supabase
        .from("scrape_logs")
        .insert({
            tracked_product_id: trackedProductId,
            attempt_number: attemptNumber,
            status,
            error_message: errorMessage,
            response_time_ms: responseTimeMs
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function savePriceHistory(
    trackedProductId,
    price,
    stockStatus,
    scrapedAt
) {
    const { data, error } = await supabase
        .from("price_history")
        .insert({
            tracked_product_id: trackedProductId,
            price,
            stock_status: stockStatus,
            scraped_at: scrapedAt
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function addTrackedProduct(product) {
    // Check if product is already being tracked
    const { data: existingProduct, error: checkError } = await supabase
        .from("tracked_products")
        .select("*")
        .eq("external_id", product.external_id)
        .maybeSingle();

    if (checkError) {
        throw checkError;
    }

    if (existingProduct) {
        return {
            alreadyTracked: true,
            product: existingProduct
        };
    }

    const { data, error } = await supabase
        .from("tracked_products")
        .insert({
            external_id: product.external_id,
            product_name: product.product_name,
            product_url: product.product_url,
            sku: product.sku || null
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return {
        alreadyTracked: false,
        product: data
    };
}


async function getTrackedProducts() {
    const { data, error } = await supabase
        .from("tracked_products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

async function getPriceHistory(trackedProductId) {
    const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("tracked_product_id", trackedProductId)
        .order("scraped_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

async function getScrapeLogs(trackedProductId) {
    const { data, error } = await supabase
        .from("scrape_logs")
        .select("*")
        .eq("tracked_product_id", trackedProductId)
        .order("attempted_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}
async function getActiveTrackedProducts() {
    const { data, error } = await supabase
        .from("tracked_products")
        .select("*")
        .eq("is_active", true)
        .order("id", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}
module.exports = {
    logScrapeAttempt,
    savePriceHistory,
    addTrackedProduct,
    getTrackedProducts,
    getScrapeLogs,
    getPriceHistory,
    getActiveTrackedProducts
};