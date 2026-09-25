const { useState, useEffect, useMemo, useRef } = React;

function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function getStatusBadge(status) {
    switch (status) {
        case 'Completed':
            return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>;
        case 'Ongoing':
            return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Ongoing</span>;
        case 'Delayed':
            return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Delayed</span>;
        default:
            return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300">{status}</span>;
    }
}

function getInvestmentBadge(status) {
    if (status.includes("Critically Under-Invested")) {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">🔴 Critically Under-Invested</span>;
    } else if (status.includes("Moderate Deficit")) {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">🟡 Moderate Deficit</span>;
    } else if (status.includes("Balanced")) {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40">🔵 Balanced Allocation</span>;
    } else if (status.includes("Well Funded")) {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">🟣 Well Funded</span>;
    } else {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">🟢 Saturated / High Spend</span>;
    }
}

function App() {
    const [summary, setSummary] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [ministries, setMinistries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [gaps, setGaps] = useState([]);
    const [overlaps, setOverlaps] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [activeTab, setActiveTab] = useState('map'); // 'map', 'gaps', 'ministries', 'overlaps', 'anomalies', 'ai', 'recommendations', 'projects'
    
    // Filters for projects explorer
    const [selectedMinistry, setSelectedMinistry] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Map tile provider & custom key
    const [mapTileProvider, setMapTileProvider] = useState('esri_dark'); // 'esri_dark', 'osm', 'mapbox'
    const [mapboxApiKey, setMapboxApiKey] = useState(() => localStorage.getItem('mapbox_token') || '');
    const [tempKeyInput, setTempKeyInput] = useState('');
    const [showKeyModal, setShowKeyModal] = useState(false);

    // AI Copilot State
    const [aiQuery, setAiQuery] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);

    // Selected District for drilldown modal
    const [drilldownDistrict, setDrilldownDistrict] = useState(null);

    const mapRef = useRef(null);
    const leafletMap = useRef(null);
    const markersGroup = useRef(null);

    // Initial Fetch
    useEffect(() => {
        fetchSummary();
        fetchDistricts();
        fetchMinistries();
        fetchProjects();
        fetchGaps();
        fetchOverlaps();
        fetchAnomalies();
        fetchRecommendations();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/summary');
            const data = await res.json();
            if (data.status === 'success') setSummary(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchDistricts = async () => {
        try {
            const res = await fetch('/api/districts');
            const data = await res.json();
            if (data.status === 'success') setDistricts(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchMinistries = async () => {
        try {
            const res = await fetch('/api/ministries');
            const data = await res.json();
            if (data.status === 'success') setMinistries(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data.status === 'success') setProjects(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchGaps = async () => {
        try {
            const res = await fetch('/api/analytics/gaps');
            const data = await res.json();
            if (data.status === 'success') setGaps(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchOverlaps = async () => {
        try {
            const res = await fetch('/api/analytics/overlaps');
            const data = await res.json();
            if (data.status === 'success') setOverlaps(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchAnomalies = async () => {
        try {
            const res = await fetch('/api/analytics/anomalies');
            const data = await res.json();
            if (data.status === 'success') setAnomalies(data.data);
        } catch (e) { console.error(e); }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fetch('/api/recommendations');
            const data = await res.json();
            if (data.status === 'success') setRecommendations(data.data);
        } catch (e) { console.error(e); }
    };

    // AI Natural Language Query Submission
    const handleAiSubmit = async (queryText) => {
        const q = queryText || aiQuery;
        if (!q.trim()) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setAiResponse(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (activeTab !== 'map' || !mapRef.current || districts.length === 0) return;

        // Cleanup existing map if present to avoid "Map container is already initialized"
        if (leafletMap.current) {
            try {
                leafletMap.current.remove();
            } catch(e) {}
            leafletMap.current = null;
        }

        const map = L.map(mapRef.current, {
            center: [22.5937, 78.9629],
            zoom: 5,
            scrollWheelZoom: true
        });
        leafletMap.current = map;

        // Determine Tile Provider
        let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        let attr = '&copy; Esri, HERE, Garmin, OpenStreetMap';

        if (mapTileProvider === 'osm') {
            tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        } else if (mapTileProvider === 'mapbox' && mapboxApiKey) {
            tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxApiKey}`;
            attr = '&copy; <a href="https://www.mapbox.com/">Mapbox</a>';
        }

        L.tileLayer(tileUrl, {
            attribution: attr,
            maxZoom: 18,
        }).addTo(map);

        const group = L.layerGroup().addTo(map);
        markersGroup.current = group;

        // Populate markers
        districts.forEach(d => {
            let color = '#3b82f6';
            if (d.investment_status.includes('Critically Under-Invested')) color = '#ef4444';
            else if (d.investment_status.includes('Moderate Deficit')) color = '#f59e0b';
            else if (d.investment_status.includes('Saturated')) color = '#10b981';
            else if (d.investment_status.includes('Well Funded')) color = '#6366f1';

            const circle = L.circleMarker([d.latitude, d.longitude], {
                radius: 12,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.85
            });

            const popupHtml = `
                <div class="p-1 text-slate-100 font-sans leading-tight">
                    <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
                        <span class="font-bold text-sm text-white">${d.district}</span>
                        <span class="text-xs text-slate-400 font-semibold">${d.state}</span>
                    </div>
                    <div class="text-xs space-y-1 my-2">
                        <div class="flex justify-between text-slate-300">
                            <span>Status:</span>
                            <span class="font-semibold text-amber-400">${d.investment_status}</span>
                        </div>
                        <div class="flex justify-between text-slate-300">
                            <span>Need Index:</span>
                            <span class="font-mono text-rose-400 font-bold">${d.composite_need_index}/100</span>
                        </div>
                        <div class="flex justify-between text-slate-300">
                            <span>Total Spent:</span>
                            <span class="font-mono text-emerald-400 font-bold">₹${(d.total_spent / 10000000).toFixed(2)} Cr</span>
                        </div>
                        <div class="flex justify-between text-slate-300">
                            <span>Per Capita Spend:</span>
                            <span class="font-mono text-sky-400 font-bold">₹${d.per_capita_spend}</span>
                        </div>
                        <div class="flex justify-between text-slate-300">
                            <span>Active Projects:</span>
                            <span class="font-semibold text-white">${d.project_count} projects</span>
                        </div>
                    </div>
                    <button onclick="window.triggerDistrictDrilldown('${d.district}')" class="w-full mt-2 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded cursor-pointer transition">
                        Inspect District Projects →
                    </button>
                </div>
            `;
            circle.bindPopup(popupHtml);
            group.addLayer(circle);
        });

        // Invalidate size to ensure proper tile coverage in all containers
        const timer = setTimeout(() => {
            if (leafletMap.current) {
                leafletMap.current.invalidateSize();
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            if (leafletMap.current) {
                try {
                    leafletMap.current.remove();
                } catch(e) {}
                leafletMap.current = null;
            }
        };
    }, [activeTab, districts, mapTileProvider, mapboxApiKey]);

    // Handle global click for popup button
    useEffect(() => {
        window.triggerDistrictDrilldown = (districtName) => {
            const found = districts.find(d => d.district === districtName);
            if (found) setDrilldownDistrict(found);
        };
        return () => { delete window.triggerDistrictDrilldown; };
    }, [districts]);

    // Render Ministry Charts when Ministries tab active
    useEffect(() => {
        if (activeTab === 'ministries' && ministries.length > 0) {
            const ctx1 = document.getElementById('ministryBudgetChart');
            const ctx2 = document.getElementById('ministryProgressChart');

            if (ctx1) {
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: ministries.map(m => m.ministry.replace('Ministry of ', '')),
                        datasets: [
                            {
                                label: 'Allocated Budget (₹ Cr)',
                                data: ministries.map(m => (m.total_budget / 10000000).toFixed(2)),
                                backgroundColor: 'rgba(59, 130, 246, 0.75)',
                                borderColor: '#3b82f6',
                                borderWidth: 1
                            },
                            {
                                label: 'Amount Spent (₹ Cr)',
                                data: ministries.map(m => (m.total_spent / 10000000).toFixed(2)),
                                backgroundColor: 'rgba(16, 185, 129, 0.75)',
                                borderColor: '#10b981',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: '#cbd5e1' } } },
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1e293b' } },
                            y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                        }
                    }
                });
            }

            if (ctx2) {
                new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ministries.map(m => m.ministry.replace('Ministry of ', '')),
                        datasets: [{
                            data: ministries.map(m => m.total_beneficiaries),
                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
                        }
                    }
                });
            }
        }
    }, [activeTab, ministries]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchMin = selectedMinistry === 'All' || p.ministry === selectedMinistry;
            const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
            const matchStat = selectedStatus === 'All' || p.status === selectedStatus;
            const matchSearch = !searchQuery || 
                p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.project_id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchMin && matchCat && matchStat && matchSearch;
        });
    }, [projects, selectedMinistry, selectedCategory, selectedStatus, searchQuery]);

    // Distinct ministries and categories for filters
    const filterMinistries = useMemo(() => ['All', ...new Set(projects.map(p => p.ministry))], [projects]);
    const filterCategories = useMemo(() => ['All', ...new Set(projects.map(p => p.category))], [projects]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-xl font-black text-white">GOV</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-extrabold text-lg text-white tracking-tight">BharatGov AI</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                                Problem EL-03
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                                3 Heterogeneous Datasets Harmonized
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Cross-Ministry Governance, Investment Gap & Impact Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setActiveTab('ai'); setAiQuery('Which districts have high malnutrition but low nutrition spend?'); handleAiSubmit('Which districts have high malnutrition but low nutrition spend?'); }}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition"
                    >
                        <span>✨ Ask AI Copilot</span>
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                        <span>📄 Export Policy Brief</span>
                    </button>
                </div>
            </header>

            {/* Sub-header Metric Summary Ticker */}
            {summary && (
                <div className="bg-slate-900/50 border-b border-slate-800/80 px-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Sanctioned Outlay</span>
                            <p className="text-xl font-bold font-mono text-white mt-1">{formatCurrency(summary.total_budget)}</p>
                            <span className="text-[10px] text-slate-500">{summary.schemes_count} central schemes</span>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Disbursed Funds</span>
                            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(summary.total_spent)}</p>
                            <span className="text-[10px] text-emerald-500/80 font-semibold">{summary.utilization_rate}% capital utilized</span>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Beneficiaries</span>
                            <p className="text-xl font-bold font-mono text-sky-400 mt-1">{summary.total_beneficiaries.toLocaleString()}</p>
                            <span className="text-[10px] text-slate-500">Across 13 states/districts</span>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Execution Progress</span>
                            <p className="text-xl font-bold font-mono text-indigo-400 mt-1">{summary.avg_progress}%</p>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${summary.avg_progress}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-rose-900/40 transition">
                            <span className="text-[11px] font-semibold uppercase text-rose-400 tracking-wider">Need Gaps Flagged</span>
                            <p className="text-xl font-bold font-mono text-rose-400 mt-1">{summary.under_invested_districts_count} Districts</p>
                            <span className="text-[10px] text-rose-400/80">Critically under-invested</span>
                        </div>
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-amber-900/40 transition">
                            <span className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider">Spending Anomalies</span>
                            <p className="text-xl font-bold font-mono text-amber-400 mt-1">{summary.high_anomalies_count} Critical</p>
                            <span className="text-[10px] text-amber-400/80">{summary.anomalies_count} total flags</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-slate-800 bg-slate-950/60 sticky top-[69px] z-30 backdrop-blur-md">
                <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5">
                    {[
                        { id: 'map', label: '🗺️ Geospatial Map', count: districts.length },
                        { id: 'gaps', label: '⚖️ Gap Engine (Invested vs Not)', count: gaps.length },
                        { id: 'ministries', label: '📊 Ministry Portfolio', count: ministries.length },
                        { id: 'overlaps', label: '🔄 Scheme Redundancies', count: overlaps.length },
                        { id: 'anomalies', label: '⚠️ Anomaly Radar', count: anomalies.length },
                        { id: 'ai', label: '🧠 AI Governance Copilot', badge: 'Natural Language' },
                        { id: 'recommendations', label: '📜 Policy Directives', count: recommendations.length },
                        { id: 'projects', label: '📋 All 60 Projects', count: projects.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    {tab.count}
                                </span>
                            )}
                            {tab.badge && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Body */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

                {/* TAB 1: GEOSPATIAL MAP */}
                {activeTab === 'map' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        <span>National Investment Intensity & Need Disparity Map</span>
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Districts are color-coded by investment gap (Need Z-Score vs. Per Capita Central Outlay). Click any circle to view district metrics and drilldown.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[11px] items-center bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                                    <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Under-Invested</span>
                                    <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate Deficit</span>
                                    <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Balanced</span>
                                    <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Saturated</span>
                                </div>
                            </div>

                            {/* Map Layer Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Map Tiles:</span>
                                    <button 
                                        onClick={() => setMapTileProvider('esri_dark')}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                            mapTileProvider === 'esri_dark' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        🌙 Esri Dark (Free, No Key)
                                    </button>
                                    <button 
                                        onClick={() => setMapTileProvider('osm')}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                            mapTileProvider === 'osm' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        🗺️ OpenStreetMap (Free, No Key)
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (!mapboxApiKey) {
                                                setShowKeyModal(true);
                                            } else {
                                                setMapTileProvider('mapbox');
                                            }
                                        }}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                            mapTileProvider === 'mapbox' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        🛰️ Mapbox {mapboxApiKey ? '✓ Active' : '(Custom Key)'}
                                    </button>
                                </div>

                                <button 
                                    onClick={() => { setTempKeyInput(mapboxApiKey); setShowKeyModal(true); }}
                                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                                >
                                    <span>🔑 Mapbox API Key Settings</span>
                                </button>
                            </div>
                            
                            <div id="map" ref={mapRef}></div>
                        </div>

                        {/* District Quick Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {districts.map(d => (
                                <div key={d.district} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{d.district}, <span className="text-slate-400 font-normal">{d.state}</span></h3>
                                            <p className="text-[11px] text-slate-400">Pop: {(d.population / 100000).toFixed(1)} Lakh</p>
                                        </div>
                                        {getInvestmentBadge(d.investment_status)}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 my-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Need Index</span>
                                            <span className="font-mono font-bold text-rose-400">{d.composite_need_index}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Spent</span>
                                            <span className="font-mono font-bold text-emerald-400">₹{(d.total_spent / 10000000).toFixed(1)} Cr</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Per Capita</span>
                                            <span className="font-mono font-bold text-sky-400">₹{d.per_capita_spend}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-400">{d.project_count} central projects</span>
                                        <button 
                                            onClick={() => setDrilldownDistrict(d)}
                                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: GAP ENGINE (WHERE IT IS INVESTED & WHERE IT ISN'T) */}
                {activeTab === 'gaps' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="max-w-3xl">
                                <h2 className="text-lg font-bold text-white">Investment vs. Need Gap Engine</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Quantifies the mismatch between district deprivation (Poverty, Child Malnutrition %, Healthcare Deficit %, Agrarian Stress) and actual Union Ministry capital disbursed. High positive disparity scores identify districts that have been historically bypassed.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {gaps.map((g, idx) => (
                                <div key={g.district} className={`bg-slate-900 border rounded-xl p-5 transition ${
                                    g.investment_status.includes('Critically Under-Invested') 
                                        ? 'border-rose-900/60 bg-rose-950/10' 
                                        : g.investment_status.includes('Moderate Deficit')
                                        ? 'border-amber-900/40 bg-amber-950/10'
                                        : 'border-slate-800'
                                }`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-base text-white">{g.district}</h3>
                                                    <span className="text-xs text-slate-400">({g.state})</span>
                                                    {getInvestmentBadge(g.investment_status)}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Disparity Gap Score: <span className="font-mono font-bold text-rose-400">+{g.disparity_score}</span> (Need Index: {g.composite_need_index}/100 | Per Capita Central Spend: ₹{g.per_capita_spend})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 uppercase block">Total Spent</span>
                                                <span className="font-mono font-bold text-sm text-emerald-400">₹{(g.total_spent / 10000000).toFixed(2)} Cr</span>
                                            </div>
                                            <button 
                                                onClick={() => setDrilldownDistrict(g)}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                                            >
                                                Audit District →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Specific Gaps Drivers */}
                                    {g.specific_gaps && g.specific_gaps.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Critical Sector Deficits Detected:</span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {g.specific_gaps.map((sg, i) => (
                                                    <div key={i} className="bg-slate-950/80 border border-rose-900/30 rounded-lg p-2.5 text-xs text-slate-300 flex items-start gap-2">
                                                        <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                                                        <div>
                                                            <span className="font-semibold text-rose-300 block">{sg.sector} ({sg.severity})</span>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">{sg.driver}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: MINISTRY PORTFOLIOS */}
                {activeTab === 'ministries' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <h3 className="text-sm font-bold text-white mb-4">Ministry Budget Sanctioned vs. Disbursed</h3>
                                <canvas id="ministryBudgetChart" height="200"></canvas>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <h3 className="text-sm font-bold text-white mb-4">Direct Beneficiary Reach by Ministry</h3>
                                <canvas id="ministryProgressChart" height="200"></canvas>
                            </div>
                        </div>

                        {/* Ministry Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ministries.map(m => (
                                <div key={m.ministry} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-bold text-white text-sm leading-snug">{m.ministry}</h4>
                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            {m.utilization_rate}% Utilized
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Sanctioned</span>
                                            <span className="font-mono font-bold text-white">₹{(m.total_budget / 10000000).toFixed(2)} Cr</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Spent</span>
                                            <span className="font-mono font-bold text-emerald-400">₹{(m.total_spent / 10000000).toFixed(2)} Cr</span>
                                        </div>
                                        <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between">
                                            <span className="text-slate-400">Beneficiaries:</span>
                                            <span className="font-mono font-bold text-sky-400">{m.total_beneficiaries.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400 block mb-1">Active Schemes ({m.schemes.length}):</span>
                                        <div className="flex flex-wrap gap-1">
                                            {m.schemes.map(s => (
                                                <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: SCHEME REDUNDANCIES & OVERLAPS */}
                {activeTab === 'overlaps' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white">Cross-Ministry Scheme Redundancies & Synergies</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Discovers parallel schemes from different ministries operating inside the exact same district targeting the same beneficiary segments. Highlights opportunities to merge procurement and eliminate duplicate rosters.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {overlaps.map((o, idx) => (
                                <div key={idx} className="bg-slate-900 border border-indigo-900/40 rounded-xl p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                                {o.domain}
                                            </span>
                                            <span className="text-xs text-slate-400 font-semibold">{o.district} ({o.state})</span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                            Duplication Risk: {o.risk_level}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-xs font-semibold text-slate-300">Ministries & Schemes in Same Geography:</span>
                                            <div className="space-y-1">
                                                {o.ministries_involved.map((min, mi) => (
                                                    <div key={mi} className="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                                                        <span className="text-slate-300">{min}</span>
                                                        <span className="font-semibold text-indigo-400">{o.schemes[mi] || 'Scheme'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-xs text-slate-400 pt-1">
                                                Combined Budget: <span className="font-mono text-white font-bold">{formatCurrency(o.total_combined_budget)}</span> | Beneficiaries: <span className="font-mono text-white font-bold">{o.total_beneficiaries.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">💡 Inter-Ministerial Convergence Blueprint:</span>
                                            <p className="text-xs text-slate-300 leading-relaxed">{o.convergence_opportunity}</p>
                                            <p className="text-[11px] text-slate-500 mt-2">Projects: {o.project_ids.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: ANOMALY RADAR */}
                {activeTab === 'anomalies' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white">Expenditure & Implementation Anomaly Radar</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Surfaces projects exhibiting high financial risk, severe implementation lag, sanctioned budget overruns, or low physical progress despite high fund utilization.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {anomalies.map((a, idx) => (
                                <div key={idx} className={`bg-slate-900 border rounded-xl p-5 space-y-3 ${
                                    a.severity === 'HIGH' ? 'border-rose-900/60 bg-rose-950/10' : 'border-amber-900/40'
                                }`}>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-xs font-black rounded-md ${
                                                a.severity === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                                            }`}>
                                                {a.severity} RISK
                                            </span>
                                            <h3 className="font-bold text-white text-sm">{a.project_name}</h3>
                                            <span className="font-mono text-xs text-slate-400 font-semibold">({a.project_id})</span>
                                        </div>
                                        {getStatusBadge(a.status)}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Ministry</span>
                                            <span className="font-semibold text-slate-300">{a.ministry}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Location</span>
                                            <span className="font-semibold text-slate-300">{a.district}, {a.state}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Fund Utilization</span>
                                            <span className="font-mono font-bold text-rose-400">{a.utilization_rate}% ({formatCurrency(a.amount_spent)} / {formatCurrency(a.budget_allocated)})</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 uppercase block">Physical Progress</span>
                                            <span className="font-mono font-bold text-indigo-400">{a.progress_percent}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Trigger Factors:</span>
                                        {a.reasons.map((r, ri) => (
                                            <p key={ri} className="text-xs text-slate-300 flex items-start gap-2">
                                                <span className="text-rose-400">•</span>
                                                <span>{r}</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 6: AI GOVERNANCE COPILOT */}
                {activeTab === 'ai' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">🧠</span>
                                <div>
                                    <h2 className="text-lg font-bold text-white">AI Governance & Cross-Ministry Query Copilot</h2>
                                    <p className="text-xs text-slate-400">Ask any question in plain English across schemes, ministries, district gaps, and financial anomalies.</p>
                                </div>
                            </div>

                            {/* Query Input Box */}
                            <form onSubmit={(e) => { e.preventDefault(); handleAiSubmit(); }} className="mt-4 flex gap-2">
                                <input 
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="e.g. Which districts have high malnutrition but low nutrition spend? Or show delayed projects..."
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={aiLoading}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2"
                                >
                                    {aiLoading ? <span>Processing...</span> : <span>Run Query ✨</span>}
                                </button>
                            </form>

                            {/* Preset Query Chips */}
                            <div className="mt-4 flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-400 font-semibold">Suggested Questions:</span>
                                {[
                                    "Which districts have high malnutrition but low nutrition spend?",
                                    "Show delayed projects with high spend",
                                    "Find scheme overlaps in Pune",
                                    "Compare Ministry of Agriculture and Rural Development",
                                    "Show projects with sanctioned budget overrun",
                                    "Audit governance profile of Patna"
                                ].map((prompt, pi) => (
                                    <button
                                        key={pi}
                                        onClick={() => { setAiQuery(prompt); handleAiSubmit(prompt); }}
                                        className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 border border-slate-700/60 rounded-lg transition"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Query Results Display */}
                        {aiResponse && (
                            <div className="bg-slate-900 border border-indigo-900/40 rounded-2xl p-6 space-y-4 shadow-xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                            {aiResponse.intent}
                                        </span>
                                        <h3 className="text-lg font-bold text-white mt-1.5">{aiResponse.headline}</h3>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">Query: "{aiResponse.query}"</span>
                                </div>

                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <p className="text-sm text-slate-200 leading-relaxed font-sans">{aiResponse.answer}</p>
                                </div>

                                {aiResponse.recommendation && (
                                    <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-xl flex items-start gap-2.5">
                                        <span className="text-emerald-400 text-sm">💡</span>
                                        <div>
                                            <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">AI Policy Directive:</span>
                                            <p className="text-xs text-slate-300 mt-0.5">{aiResponse.recommendation}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Matching Records Table */}
                                {aiResponse.records && aiResponse.records.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Directly Grounded Data Points:</h4>
                                        <div className="overflow-x-auto border border-slate-800 rounded-xl">
                                            <table className="w-full text-left text-xs text-slate-300">
                                                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                                                    <tr>
                                                        <th className="p-2.5">Entity / Identifier</th>
                                                        <th className="p-2.5">Context / Ministry</th>
                                                        <th className="p-2.5">Primary Metric</th>
                                                        <th className="p-2.5">Status / Flag</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                                    {aiResponse.records.slice(0, 6).map((rec, ri) => (
                                                        <tr key={ri} className="hover:bg-slate-800/30">
                                                            <td className="p-2.5 font-bold text-white">
                                                                {rec.project_id || rec.district || rec.domain || `Item #${ri+1}`}
                                                            </td>
                                                            <td className="p-2.5 text-slate-400">
                                                                {rec.ministry || rec.state || (rec.ministries_involved && rec.ministries_involved.join(', ')) || '-'}
                                                            </td>
                                                            <td className="p-2.5 text-emerald-400">
                                                                {rec.budget_allocated ? `Spend: ₹${(rec.amount_spent/10000000).toFixed(2)} Cr` : (rec.composite_need_index ? `Need: ${rec.composite_need_index}` : '-')}
                                                            </td>
                                                            <td className="p-2.5 font-sans">
                                                                {rec.status ? getStatusBadge(rec.status) : (rec.investment_status ? getInvestmentBadge(rec.investment_status) : '-')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 7: TRACEABLE POLICY DIRECTIVES */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white">Traceable Policy Directives & Reallocation Framework</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                High-level executive recommendations backed with mathematical formulas, district deprivation benchmarks, and specific project IDs for ministerial execution.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {recommendations.map(r => (
                                <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`px-2.5 py-0.5 text-xs font-black rounded-md ${
                                                r.urgency === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                                            }`}>
                                                {r.urgency}
                                            </span>
                                            <h3 className="font-bold text-white text-base">{r.title}</h3>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono font-semibold">{r.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Directive Action:</span>
                                            <p className="text-xs text-slate-200 leading-relaxed">{r.action}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Expected Measurable Impact:</span>
                                            <p className="text-xs text-slate-200 leading-relaxed">{r.expected_impact}</p>
                                        </div>
                                    </div>

                                    {/* Traceability factors */}
                                    <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Traceability & Data Grounding Factors:</span>
                                        <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(r.traceability, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 8: ALL 60 PROJECTS EXPLORER */}
                {activeTab === 'projects' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-white">Central Projects Explorer ({filteredProjects.length} / {projects.length})</h2>
                                    <p className="text-xs text-slate-400">Search and filter across all 60 central projects across 5 Union Ministries.</p>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter by scheme, name, district, or ID..."
                                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-full sm:w-72"
                                />
                            </div>

                            {/* Dropdown Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Ministry</label>
                                    <select
                                        value={selectedMinistry}
                                        onChange={(e) => setSelectedMinistry(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                                    >
                                        {filterMinistries.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                                    >
                                        {filterCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Execution Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Delayed">Delayed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Projects Data Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                                        <tr>
                                            <th className="p-3">Project ID</th>
                                            <th className="p-3">Scheme & Project</th>
                                            <th className="p-3">Ministry</th>
                                            <th className="p-3">District & State</th>
                                            <th className="p-3">Budget</th>
                                            <th className="p-3">Spent</th>
                                            <th className="p-3">Progress</th>
                                            <th className="p-3">Beneficiaries</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 font-sans">
                                        {filteredProjects.map(p => (
                                            <tr key={p.project_id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-3 font-mono font-bold text-sky-400">{p.project_id}</td>
                                                <td className="p-3">
                                                    <span className="font-bold text-white block">{p.scheme_name}</span>
                                                    <span className="text-[11px] text-slate-400">{p.project_name}</span>
                                                </td>
                                                <td className="p-3 text-slate-300">{p.ministry.replace('Ministry of ', '')}</td>
                                                <td className="p-3">
                                                    <span className="text-white font-medium block">{p.district}</span>
                                                    <span className="text-[10px] text-slate-500">{p.state}</span>
                                                </td>
                                                <td className="p-3 font-mono font-medium">{formatCurrency(p.budget_allocated)}</td>
                                                <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(p.amount_spent)}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold">{p.progress_percent}%</span>
                                                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.progress_percent}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono">{p.beneficiaries.toLocaleString()}</td>
                                                <td className="p-3">{getStatusBadge(p.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* District Drilldown Modal */}
            {drilldownDistrict && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white">{drilldownDistrict.district}, <span className="text-slate-400 font-normal">{drilldownDistrict.state}</span></h3>
                                <p className="text-xs text-slate-400">Demographic & Vulnerability Profile</p>
                            </div>
                            <button onClick={() => setDrilldownDistrict(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Population</span>
                                <span className="font-mono font-bold text-white">{(drilldownDistrict.population).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Need Index</span>
                                <span className="font-mono font-bold text-rose-400">{drilldownDistrict.composite_need_index} / 100</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Per Capita Central Spend</span>
                                <span className="font-mono font-bold text-sky-400">₹{drilldownDistrict.per_capita_spend}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase block">Total Spent</span>
                                <span className="font-mono font-bold text-emerald-400">{formatCurrency(drilldownDistrict.total_spent)}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Projects in {drilldownDistrict.district}:</span>
                            <div className="space-y-2">
                                {projects.filter(p => p.district === drilldownDistrict.district).map(p => (
                                    <div key={p.project_id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-bold text-white block">{p.scheme_name} - {p.project_name}</span>
                                            <span className="text-slate-400 text-[11px]">{p.ministry} | Budget: {formatCurrency(p.budget_allocated)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-emerald-400 font-bold block">{formatCurrency(p.amount_spent)}</span>
                                            {getStatusBadge(p.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => setDrilldownDistrict(null)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Mapbox API Key Settings Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>🔑 Map Tile & API Key Settings</span>
                                </h3>
                                <p className="text-xs text-slate-400">Configure your map tile provider and optional Mapbox token</p>
                            </div>
                            <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
                        </div>

                        <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl text-xs text-emerald-300">
                            <span className="font-bold block mb-1">✓ No API Key Required by Default:</span>
                            The app currently runs with <strong>Esri Dark Canvas</strong> and <strong>OpenStreetMap</strong>, which are 100% free and work out-of-the-box without any registration!
                        </div>

                        <div className="space-y-2 text-xs text-slate-300">
                            <span className="font-bold text-white block">Optional: Use Mapbox High-Res Tiles</span>
                            <p className="text-slate-400 leading-relaxed">
                                To use Mapbox vectors:
                                <br />1. Visit <a href="https://account.mapbox.com/" target="_blank" className="text-sky-400 underline font-semibold">https://account.mapbox.com/</a> (Free registration).
                                <br />2. On your dashboard, copy your <strong>Default public token</strong> (starts with <code className="text-amber-400">pk.eyJ...</code>).
                                <br />3. Paste it in the input below:
                            </p>

                            <input 
                                type="text"
                                value={tempKeyInput}
                                onChange={(e) => setTempKeyInput(e.target.value)}
                                placeholder="Paste Mapbox token: pk.eyJ..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 font-mono"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            {mapboxApiKey && (
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('mapbox_token');
                                        setMapboxApiKey('');
                                        setTempKeyInput('');
                                        setMapTileProvider('esri_dark');
                                        setShowKeyModal(false);
                                    }}
                                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
                                >
                                    Remove Saved Key
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button
                                    onClick={() => setShowKeyModal(false)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (tempKeyInput.trim()) {
                                            localStorage.setItem('mapbox_token', tempKeyInput.trim());
                                            setMapboxApiKey(tempKeyInput.trim());
                                            setMapTileProvider('mapbox');
                                        }
                                        setShowKeyModal(false);
                                    }}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                                >
                                    Save & Enable Mapbox
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
                AI-Powered Cross-Ministry Governance & Impact Intelligence Platform • Hackathon Problem EL-03 • Unified Multi-Dataset Architecture
            </footer>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
