import { useEffect, useState } from "react";

import {
    searchProducts,
    getTrackedProducts,
    trackProduct,
    getPriceHistory,
    getScrapeLogs
} from "./api";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import "./App.css";


function App() {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const [trackedProducts, setTrackedProducts] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [history, setHistory] = useState([]);
    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [trackingId, setTrackingId] = useState(null);

    const [error, setError] = useState("");


    useEffect(() => {
        loadTrackedProducts();
    }, []);


    async function loadTrackedProducts() {

        try {

            const products = await getTrackedProducts();

            setTrackedProducts(products);

        } catch (error) {

            setError(error.message);
        }
    }


    async function handleSearch(event) {

        const value = event.target.value;

        setQuery(value);
        setError("");

        if (!value.trim()) {

            setResults([]);

            return;
        }

        try {

            setLoading(true);

            const products = await searchProducts(value);

            setResults(products);

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);
        }
    }


    async function handleTrack(product) {

        try {

            setTrackingId(product.id);

            setError("");

            await trackProduct(product);

            await loadTrackedProducts();

            setResults([]);
            setQuery("");

        } catch (error) {

            setError(error.message);

        } finally {

            setTrackingId(null);
        }
    }


    async function handleSelectProduct(product) {

        try {

            setSelectedProduct(product);

            setDetailsLoading(true);

            setError("");

            const [historyData, logsData] = await Promise.all([
                getPriceHistory(product.id),
                getScrapeLogs(product.id)
            ]);

            setHistory(historyData);
            setLogs(logsData);

        } catch (error) {

            setError(error.message);

        } finally {

            setDetailsLoading(false);
        }
    }


    function closeDetails() {

        setSelectedProduct(null);
        setHistory([]);
        setLogs([]);
    }


    const latestRecord = history.length > 0
        ? history[0]
        : null;


    const chartData = [...history]
        .reverse()
        .map(record => ({
            time: new Date(record.scraped_at).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),
            price: record.price
        }));


    return (

        <div className="app">

            <header className="header">

                <div>

                    <h1>Price Tracker</h1>

                    <p>
                        Track product prices and stock changes over time.
                    </p>

                </div>

            </header>


            <main>

                {/* SEARCH */}

                <section className="search-section">

                    <h2>Find a product</h2>

                    <input
                        type="text"
                        placeholder="Search by product name..."
                        value={query}
                        onChange={handleSearch}
                    />

                    {loading && (
                        <p className="muted">
                            Searching...
                        </p>
                    )}


                    {results.length > 0 && (

                        <div className="search-results">

                            {results.map(product => (

                                <div
                                    className="search-result"
                                    key={product.id}
                                >

                                    <div>

                                        <strong>
                                            {product.name}
                                        </strong>

                                        <span>
                                            {product.brand} ·{" "}
                                            {product.category}
                                        </span>

                                        <small>
                                            SKU: {product.sku}
                                        </small>

                                    </div>


                                    <button
                                        onClick={() =>
                                            handleTrack(product)
                                        }
                                        disabled={
                                            trackingId === product.id
                                        }
                                    >

                                        {trackingId === product.id
                                            ? "Tracking..."
                                            : "Track"}

                                    </button>

                                </div>

                            ))}

                        </div>

                    )}

                </section>


                {error && (

                    <div className="error">
                        {error}
                    </div>

                )}


                {/* TRACKED PRODUCTS */}

                <section className="tracked-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Tracked Products
                            </h2>

                            <p>
                                Products currently being monitored.
                            </p>

                        </div>

                        <span className="count">
                            {trackedProducts.length}
                        </span>

                    </div>


                    {trackedProducts.length === 0 ? (

                        <div className="empty">
                            No products are being tracked yet.
                        </div>

                    ) : (

                        <div className="product-grid">

                            {trackedProducts.map(product => (

                                <div
                                    className="product-card clickable"
                                    key={product.id}
                                    onClick={() =>
                                        handleSelectProduct(product)
                                    }
                                >

                                    <span className="category">
                                        {product.sku || "PRODUCT"}
                                    </span>

                                    <h3>
                                        {product.product_name}
                                    </h3>

                                    <p>
                                        {product.product_url}
                                    </p>

                                    <div className="card-footer">
                                        <span>
                                            Tracking active
                                        </span>

                                        <span>
                                            View details →
                                        </span>
                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>


                {/* PRODUCT DETAILS */}

                {selectedProduct && (

                    <section className="details-section">

                        <div className="details-header">

                            <div>

                                <button
                                    className="back-button"
                                    onClick={closeDetails}
                                >
                                    ← Back
                                </button>

                                <h2>
                                    {selectedProduct.product_name}
                                </h2>

                                <p>
                                    SKU:{" "}
                                    {selectedProduct.sku || "N/A"}
                                </p>

                            </div>

                        </div>


                        {detailsLoading ? (

                            <div className="empty">
                                Loading product data...
                            </div>

                        ) : (

                            <>

                                {/* CURRENT STATUS */}

                                <div className="status-grid">

                                    <div className="status-card">

                                        <span>
                                            Current Price
                                        </span>

                                        <strong>
                                            {latestRecord
                                                ? `₹${latestRecord.price.toLocaleString()}`
                                                : "No data"}
                                        </strong>

                                    </div>


                                    <div className="status-card">

                                        <span>
                                            Stock Status
                                        </span>

                                        <strong>
                                            {latestRecord
                                                ? latestRecord.stock_status
                                                : "No data"}
                                        </strong>

                                    </div>


                                    <div className="status-card">

                                        <span>
                                            Last Scraped
                                        </span>

                                        <strong>
                                            {latestRecord
                                                ? new Date(
                                                    latestRecord.scraped_at
                                                ).toLocaleString()
                                                : "Never"}
                                        </strong>

                                    </div>

                                </div>


                                {/* PRICE HISTORY */}

                                <div className="data-card">

                                    <div className="data-card-header">

                                        <div>

                                            <h3>
                                                Price History
                                            </h3>

                                            <p>
                                                Successful scrape observations
                                            </p>

                                        </div>

                                    </div>


                                    {chartData.length === 0 ? (

                                        <div className="empty">
                                            No price history available.
                                        </div>

                                    ) : (

                                        <div className="chart">

                                            <ResponsiveContainer
                                                width="100%"
                                                height={300}
                                            >

                                                <LineChart
                                                    data={chartData}
                                                >

                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                    />

                                                    <XAxis
                                                        dataKey="time"
                                                    />

                                                    <YAxis />

                                                    <Tooltip
                                                        formatter={(value) =>
                                                            `₹${Number(value).toLocaleString()}`
                                                        }
                                                    />

                                                    <Line
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke="#111827"
                                                        strokeWidth={2}
                                                        dot
                                                    />

                                                </LineChart>

                                            </ResponsiveContainer>

                                        </div>

                                    )}


                                    {history.length > 0 && (

                                        <div className="history-table">

                                            <div className="table-row table-header">

                                                <span>
                                                    Time
                                                </span>

                                                <span>
                                                    Price
                                                </span>

                                                <span>
                                                    Stock
                                                </span>

                                            </div>


                                            {history.map(record => (

                                                <div
                                                    className="table-row"
                                                    key={record.id}
                                                >

                                                    <span>
                                                        {new Date(
                                                            record.scraped_at
                                                        ).toLocaleString()}
                                                    </span>

                                                    <strong>
                                                        ₹{record.price.toLocaleString()}
                                                    </strong>

                                                    <span>
                                                        {record.stock_status}
                                                    </span>

                                                </div>

                                            ))}

                                        </div>

                                    )}

                                </div>


                                {/* SCRAPE LOGS */}

                                <div className="data-card">

                                    <div className="data-card-header">

                                        <div>

                                            <h3>
                                                Scrape Logs
                                            </h3>

                                            <p>
                                                Every scraper attempt is recorded.
                                            </p>

                                        </div>

                                    </div>


                                    {logs.length === 0 ? (

                                        <div className="empty">
                                            No scrape attempts yet.
                                        </div>

                                    ) : (

                                        <div className="logs-table">

                                            <div className="table-row table-header">

                                                <span>
                                                    Time
                                                </span>

                                                <span>
                                                    Attempt
                                                </span>

                                                <span>
                                                    Status
                                                </span>

                                                <span>
                                                    Response
                                                </span>

                                            </div>


                                            {logs.map(log => (

                                                <div
                                                    className="table-row"
                                                    key={log.id}
                                                >

                                                    <span>
                                                        {new Date(
                                                            log.attempted_at
                                                        ).toLocaleString()}
                                                    </span>

                                                    <span>
                                                        #{log.attempt_number}
                                                    </span>

                                                    <span
                                                        className={`status ${log.status}`}
                                                    >
                                                        {log.status}
                                                    </span>

                                                    <span>
                                                        {log.response_time_ms
                                                            ? `${log.response_time_ms} ms`
                                                            : "-"}
                                                    </span>

                                                </div>

                                            ))}

                                        </div>

                                    )}

                                </div>

                            </>

                        )}

                    </section>

                )}

            </main>

        </div>
    );
}

export default App;