function AppHeader({ trackedCount }) {
    return <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true">⌁</span><div><p className="eyebrow">PRICE INTELLIGENCE</p><h1>PriceWatch</h1></div></div><div className="header-status"><span className="live-dot" />{trackedCount} active {trackedCount === 1 ? "item" : "items"}</div></header>;
}
export default AppHeader;
