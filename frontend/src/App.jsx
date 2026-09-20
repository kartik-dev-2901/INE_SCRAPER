import { useEffect, useMemo, useState } from "react";
import { getPriceHistory, getScrapeLogs, getTrackedProducts, searchProducts, trackProduct } from "./api";
import AppHeader from "./components/AppHeader";
import DashboardPage from "./pages/DashboardPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
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

        } catch (requestError) {
            setError(requestError.message);
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

        } catch (requestError) {
            setError(requestError.message);

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

        } catch (requestError) {
            setError(requestError.message);

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

        } catch (requestError) {
            setError(requestError.message);

        } finally {

            setDetailsLoading(false);
        }
    }


    function closeDetails() {

        setSelectedProduct(null);
        setHistory([]);
        setLogs([]);
    }


    const chartData = useMemo(() => [...history].reverse().map(record => ({
            time: new Date(record.scraped_at).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),
            price: record.price
        })), [history]);


    return (

        <div className="app-shell">
            <AppHeader trackedCount={trackedProducts.length} />
            <main className="app-content">
                {error && <div className="alert" role="alert">{error}</div>}
                {selectedProduct ? <ProductDetailsPage chartData={chartData} history={history} loading={detailsLoading} logs={logs} product={selectedProduct} onBack={closeDetails} /> : <DashboardPage loading={loading} query={query} results={results} trackedProducts={trackedProducts} trackingId={trackingId} onSearch={handleSearch} onSelectProduct={handleSelectProduct} onTrack={handleTrack} />}
            </main>
        </div>
    );
}

export default App;
