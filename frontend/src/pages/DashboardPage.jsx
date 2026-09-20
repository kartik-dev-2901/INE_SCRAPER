import ProductSearch from "../components/ProductSearch";
import TrackedProducts from "../components/TrackedProducts";
function DashboardPage(props) { return <><ProductSearch loading={props.loading} query={props.query} results={props.results} trackingId={props.trackingId} onSearch={props.onSearch} onTrack={props.onTrack} /><TrackedProducts products={props.trackedProducts} onSelect={props.onSelectProduct} /></>; }
export default DashboardPage;
