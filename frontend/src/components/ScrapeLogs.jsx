function ScrapeLogs({ logs }) {
    return <section className="data-card"><div className="data-card-header"><p className="eyebrow">ACTIVITY</p><h3>Scrape logs</h3><p>Every scraper attempt is recorded here.</p></div>{logs.length === 0 ? <div className="empty-data">No scrape attempts yet.</div> : <div className="table-wrap logs-table"><div className="table-row table-header"><span>Time</span><span>Attempt</span><span>Status</span><span>Response</span></div>{logs.map(log => <div className="table-row" key={log.id}><span>{new Date(log.attempted_at).toLocaleString()}</span><span>#{log.attempt_number}</span><span className={`status ${log.status}`}>{log.status}</span><span>{log.response_time_ms ? `${log.response_time_ms} ms` : "-"}</span></div>)}</div>}</section>;
}
export default ScrapeLogs;
