const API_URL = "http://localhost:3000/api";

export async function searchProducts(query) {
    const response = await fetch(
        `${API_URL}/products/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
        throw new Error("Failed to search products");
    }

    return response.json();
}

export async function getTrackedProducts() {
    const response = await fetch(
        `${API_URL}/tracked-products`
    );

    if (!response.ok) {
        throw new Error("Failed to load tracked products");
    }

    return response.json();
}

export async function trackProduct(product) {
    const response = await fetch(
        `${API_URL}/tracked-products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                external_id: String(product.id),
                product_name: product.name,
                product_url: product.product_url,
                sku: product.sku
            })
        }
    );


    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to track product");
    }

    return data;
}
export async function getPriceHistory(productId) {
    const response = await fetch(
        `${API_URL}/tracked-products/${productId}/history`
    );

    if (!response.ok) {
        throw new Error("Failed to load price history");
    }

    return response.json();
}

export async function getScrapeLogs(productId) {
    const response = await fetch(
        `${API_URL}/tracked-products/${productId}/logs`
    );

    if (!response.ok) {
        throw new Error("Failed to load scrape logs");
    }

    return response.json();
}