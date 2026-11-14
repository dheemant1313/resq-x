import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Gauge,
  Sliders,
  Play,
  RotateCcw,
  GitBranch,
  ShieldAlert,
  ChevronRight,
  Route,
  Zap,
  Flame,
  Award
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type {
  DijkstraNodeDTO,
  DijkstraEdgeDTO,
  DijkstraGraphDTO,
  DijkstraResponseDTO,
  DijkstraBenchmarkDTO
} from './types';

// Map Auto-Bounds Controller
const MapBoundsController: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [coordinates, map]);
  return null;
};

// Custom Leaflet Div Icons
const createNodeIcon = (node: DijkstraNodeDTO, isOrigin: boolean, isDestination: boolean, isPathNode: boolean) => {
  let bgColor = '#1e293b'; // slate-800
  let borderColor = '#64748b'; // slate-500
  let labelColor = '#94a3b8';
  let badgeText = '';

  if (isOrigin) {
    bgColor = '#065f46'; // emerald-900
    borderColor = '#10b981'; // emerald-500
    labelColor = '#34d399';
    badgeText = 'SRC';
  } else if (isDestination) {
    bgColor = '#7f1d1d'; // red-900
    borderColor = '#ef4444'; // red-500
    labelColor = '#f87171';
    badgeText = 'DST';
  } else if (isPathNode) {
    bgColor = '#0f766e'; // teal-900
    borderColor = '#14b8a6'; // teal-500
    labelColor = '#2dd4bf';
    badgeText = 'WAY';
  } else if (node.node_type === 'CENTRAL_DEPOT') {
    bgColor = '#1e1b4b'; // indigo-950
    borderColor = '#6366f1'; // indigo-500
    labelColor = '#818cf8';
    badgeText = 'DEPOT';
  } else if (node.node_type === 'RELIEF_CENTER') {
    bgColor = '#31102b'; // fuchsia-950
    borderColor = '#d946ef'; // fuchsia-500
    labelColor = '#e879f9';
    badgeText = 'CAMP';
  } else if (node.node_type === 'BRIDGE') {
    bgColor = '#164e63'; // cyan-950
    borderColor = '#06b6d4'; // cyan-500
    labelColor = '#22d3ee';
    badgeText = 'BRIDGE';
  } else if (node.node_type === 'MOUNTAIN_PASS') {
    bgColor = '#451a03'; // amber-950
    borderColor = '#f59e0b'; // amber-500
    labelColor = '#fbbf24';
    badgeText = 'PASS';
  }

  const html = `
    <div style="
      background: ${bgColor};
      border: 2px solid ${borderColor};
      color: ${labelColor};
      border-radius: 8px;
      padding: 4px 7px;
      font-family: monospace;
      font-size: 10px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${borderColor};"></span>
      <span>${node.code}</span>
      ${badgeText ? `<span style="font-size:8px; opacity:0.8; border-left:1px solid ${borderColor}; padding-left:3px;">${badgeText}</span>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [0, 0]
  });
};

export const OperatorRouteMapView: React.FC = () => {
  const [network, setNetwork] = useState<DijkstraGraphDTO | null>(null);
  const [benchmarks, setBenchmarks] = useState<DijkstraBenchmarkDTO[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState<boolean>(true);
  const [startNode, setStartNode] = useState<string>('DEPOT_CENTRAL');
  const [endNode, setEndNode] = useState<string>('RC-ALPHA');
  const [metric, setMetric] = useState<'weighted' | 'distance'>('weighted');
  const [avoidHighRisk, setAvoidHighRisk] = useState<boolean>(false);
  const [compareFewestEdges, setCompareFewestEdges] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<DijkstraResponseDTO | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'corridors' | 'theory' | 'road_editor'>('corridors');
  const [selectedRoad, setSelectedRoad] = useState<DijkstraEdgeDTO | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const token = ApiClient.getToken() || localStorage.getItem('resqx_token') || localStorage.getItem('resqx_access_token');
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  // Load Network Topology & Benchmarks
  const loadNetworkData = async () => {
    setLoadingNetwork(true);
    setErrorMsg(null);
    try {
      const [netRes, benchRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/algorithms/dijkstra/network', { credentials: 'omit', headers: authHeaders }),
        fetch('http://127.0.0.1:8000/api/v1/algorithms/dijkstra/benchmarks', { credentials: 'omit', headers: authHeaders })
      ]);

      if (!netRes.ok) throw new Error(`Failed to load network topology: HTTP ${netRes.status}`);
      const netData = await netRes.json();
      setNetwork(netData);

      if (benchRes.ok) {
        const benchData = await benchRes.json();
        setBenchmarks(benchData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setErrorMsg(msg);
    } finally {
      setLoadingNetwork(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, []);

  // Execute Dijkstra Shortest Path Solver
  const handleSolveRoute = async (
    overrideStart?: string,
    overrideEnd?: string,
    overrideMetric?: 'weighted' | 'distance',
    overrideAvoidRisk?: boolean,
    overrideCompareBFS?: boolean
  ) => {
    const s = overrideStart || startNode;
    const e = overrideEnd || endNode;
    const m = overrideMetric || metric;
    const risk = overrideAvoidRisk !== undefined ? overrideAvoidRisk : avoidHighRisk;
    const bfs = overrideCompareBFS !== undefined ? overrideCompareBFS : compareFewestEdges;

    if (!s || !e) {
      setErrorMsg('Please select both Origin and Destination nodes.');
      return;
    }

    setOptimizing(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/algorithms/dijkstra/route', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          start_node: s,
          end_node: e,
          metric: m,
          avoid_high_risk: risk,
          compare_with_fewest_edges: bfs,
          include_step_trace: true
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Route solver returned HTTP ${res.status}`);
      }

      const data: DijkstraResponseDTO = await res.json();
      setRouteResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error computing shortest path';
      setErrorMsg(msg);
      setRouteResult(null);
    } finally {
      setOptimizing(false);
    }
  };

  // Toggle Road Blocked / Open
  const handleToggleRoad = async (roadId: string) => {
    setActionSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/algorithms/dijkstra/roads/${roadId}/toggle`, {
        method: 'PATCH',
        headers: authHeaders
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Failed to update road: HTTP ${res.status}`);
      }

      const data = await res.json();
      setActionSuccessMsg(data.message || `Road ${roadId} status updated.`);

      // Refresh network and re-solve route if active
      await loadNetworkData();
      if (routeResult) {
        handleSolveRoute();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setErrorMsg(msg);
    }
  };

  // Reset Network to Default Baseline
  const handleResetNetwork = async () => {
    setActionSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/algorithms/dijkstra/network/reset', {
        method: 'POST',
        headers: authHeaders
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Failed to reset network: HTTP ${res.status}`);
      }

      const data = await res.json();
      setNetwork(data.network);
      setActionSuccessMsg('Disaster road network restored to operational baseline.');
      setRouteResult(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      setErrorMsg(msg);
    }
  };

  // Load a Pre-Configured Viva Benchmark
  const handleLoadBenchmark = async (bench: DijkstraBenchmarkDTO) => {
    setStartNode(bench.start_node);
    setEndNode(bench.end_node);
    setMetric(bench.metric);
    setAvoidHighRisk(bench.avoid_high_risk);
    setCompareFewestEdges(bench.compare_with_fewest_edges);

    // If benchmark has setup actions (e.g. block a road), apply them first
    if (bench.setup_action?.block_road_ids && bench.setup_action.block_road_ids.length > 0) {
      for (const rId of bench.setup_action.block_road_ids) {
        await handleToggleRoad(rId);
      }
    }

    // Trigger solver
    handleSolveRoute(
      bench.start_node,
      bench.end_node,
      bench.metric,
      bench.avoid_high_risk,
      bench.compare_with_fewest_edges
    );
  };

  // Node coordinate lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, DijkstraNodeDTO>();
    network?.nodes.forEach(n => map.set(n.code, n));
    return map;
  }, [network]);

  // Center coordinate for map
  const mapCenter: [number, number] = useMemo(() => {
    if (network && network.nodes.length > 0) {
      const avgLat = network.nodes.reduce((acc, n) => acc + n.latitude, 0) / network.nodes.length;
      const avgLng = network.nodes.reduce((acc, n) => acc + n.longitude, 0) / network.nodes.length;
      return [avgLat, avgLng];
    }
    return [19.0760, 72.8777]; // Default Mumbai coastal coordinate
  }, [network]);

  // All coordinates for auto-fit
  const allCoordinates: [number, number][] = useMemo(() => {
    if (routeResult && routeResult.path_coordinates.length > 0) {
      return routeResult.path_coordinates;
    }
    return network?.nodes.map(n => [n.latitude, n.longitude] as [number, number]) || [];
  }, [routeResult, network]);

  // Set of nodes in optimal path
  const pathNodeSet = useMemo(() => {
    return new Set(routeResult?.path || []);
  }, [routeResult]);

  // Alternative route coordinates
  const altPathCoordinates: [number, number][] = useMemo(() => {
    if (!routeResult?.alternative_route_comparison?.path) return [];
    return routeResult.alternative_route_comparison.path
      .map(code => {
        const node = nodeMap.get(code);
        return node ? [node.latitude, node.longitude] as [number, number] : null;
      })
      .filter((c): c is [number, number] => c !== null);
  }, [routeResult, nodeMap]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Theory & Safety Disclaimers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Navigation className="w-64 h-64 text-teal-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5" />
                PHASE 8: DIJKSTRA'S SHORTEST PATH
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Min-Heap Priority Queue
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                O((V + E) log V)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Disaster Route Optimization & Interactive Map
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Dynamic pathfinding through flood inundation zones, collapsed bridges, and landslide defiles.
              Calculates shortest weighted convoy corridors using priority queue relaxation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetNetwork}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Reset all road blockages and multipliers to baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Reset Network
            </button>
            <button
              onClick={() => handleSolveRoute()}
              disabled={optimizing || loadingNetwork}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {optimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Solving Dijkstra...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Calculate Optimal Route
                </>
              )}
            </button>
          </div>
        </div>

        {/* Safety & Academic Disclaimer Banner */}
        <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-bold text-amber-300">SIMULATION DISCLAIMER & ETHICAL TRANSPARENCY:</span> The road network, distances,
            and terrain condition multipliers shown below are mathematically verified algorithmic models for disaster triage simulation.
            They are <span className="underline font-semibold">not certified live emergency evacuation routes</span> and do not claim unverified real-time satellite telemetry.
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Route Planner & Viva Benchmarks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Configuration & Benchmark Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dispatch Corridor Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                Dispatch Corridor Config
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Dijkstra Min-Heap</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>Origin (Start Node)</span>
                  <span className="text-emerald-400 font-mono text-[10px]">SRC PIN</span>
                </label>
                <select
                  value={startNode}
                  onChange={e => setStartNode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  {network?.nodes.map(n => (
                    <option key={n.code} value={n.code}>
                      {n.code} — {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>Destination (Target Node)</span>
                  <span className="text-red-400 font-mono text-[10px]">DST PIN</span>
                </label>
                <select
                  value={endNode}
                  onChange={e => setEndNode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  {network?.nodes.map(n => (
                    <option key={n.code} value={n.code}>
                      {n.code} — {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optimization Metric Radio */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cost Optimization Metric</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetric('weighted')}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all ${
                      metric === 'weighted'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-semibold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Zap className="w-3 h-3 text-teal-400" />
                      Weighted Cost
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Terrain & hazard penalties</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetric('distance')}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all ${
                      metric === 'distance'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-semibold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      Physical Distance
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Pure km distance only</div>
                  </button>
                </div>
              </div>

              {/* Advanced Constraints */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={avoidHighRisk}
                    onChange={e => setAvoidHighRisk(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
                  />
                  <span>Avoid High-Risk Hazard Corridors (&gt; 2.0 Rating)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={compareFewestEdges}
                    onChange={e => setCompareFewestEdges(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-500"
                  />
                  <span>Compare with BFS (Proof: Dijkstra != Fewest Hops)</span>
                </label>
              </div>

              <button
                onClick={() => handleSolveRoute()}
                disabled={optimizing}
                className="w-full mt-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all"
              >
                {optimizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Route className="w-4 h-4" />
                )}
                SOLVE SHORTEST ROUTE (DIJKSTRA)
              </button>
            </div>
          </div>

          {/* Academic & Viva Benchmark Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Viva & Academic Benchmarks
              </h3>
              <span className="text-[10px] text-slate-500">1-Click Scenarios</span>
            </div>

            <div className="space-y-2">
              {benchmarks.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleLoadBenchmark(b)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-teal-300 flex items-center gap-1">
                      <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                      {b.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                      {b.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 pl-4">
                    {b.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Map Top Bar */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono text-slate-200 font-semibold">OpenStreetMap Live Canvas</span>
                </div>
                <span>Nodes: {network?.nodes.length || 0}</span>
                <span>Corridors: {network?.edges.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Click node to inspect | Click road to toggle block</span>
              </div>
            </div>

            {/* Map Leaflet Container */}
            <div style={{ height: '460px', width: '100%', position: 'relative', zIndex: 1 }}>
              {loadingNetwork ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
                  <span className="text-xs">Loading OpenStreetMap road topology...</span>
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%', background: '#090d16' }}
                >
                  <MapBoundsController coordinates={allCoordinates} />

                  {/* Dark-themed OpenStreetMap TileLayer */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    opacity={0.85}
                  />

                  {/* 1. Road Edges (Lines) */}
                  {network?.edges.map(edge => {
                    const src = nodeMap.get(edge.source);
                    const tgt = nodeMap.get(edge.target);
                    if (!src || !tgt) return null;

                    const positions: [number, number][] = [
                      [src.latitude, src.longitude],
                      [tgt.latitude, tgt.longitude]
                    ];

                    let color = '#38bdf8'; // sky-400
                    let weight = 3;
                    let dashArray = undefined;
                    let opacity = 0.6;

                    if (edge.is_blocked) {
                      color = '#ef4444'; // red-500
                      weight = 4;
                      dashArray = '6, 6';
                      opacity = 0.95;
                    } else if (edge.condition_multiplier > 1.3 || edge.risk_factor > 2.0) {
                      color = '#f59e0b'; // amber-500
                      weight = 3.5;
                      dashArray = '4, 4';
                    }

                    return (
                      <Polyline
                        key={`edge-${edge.id || `${edge.source}-${edge.target}`}`}
                        positions={positions}
                        pathOptions={{ color, weight, dashArray, opacity }}
                        eventHandlers={{
                          click: () => {
                            setSelectedRoad(edge);
                            setActiveTab('road_editor');
                          }
                        }}
                      >
                        <Tooltip sticky direction="top" opacity={0.95}>
                          <div className="font-mono text-xs p-1 bg-slate-900 text-slate-100 rounded border border-slate-700">
                            <div className="font-bold text-teal-400">{edge.road_name || 'Corridor'}</div>
                            <div>{edge.source} &harr; {edge.target}</div>
                            <div>Distance: {edge.distance_km} km | Mult: x{edge.condition_multiplier}</div>
                            {edge.is_blocked && (
                              <div className="text-red-400 font-bold mt-1">&times; ROAD BLOCKED (IMPASSABLE)</div>
                            )}
                          </div>
                        </Tooltip>
                      </Polyline>
                    );
                  })}

                  {/* 2. Alternative / BFS Comparison Route (Violet dashed) */}
                  {altPathCoordinates.length > 1 && (
                    <Polyline
                      positions={altPathCoordinates}
                      pathOptions={{
                        color: '#a855f7', // purple-500
                        weight: 4,
                        dashArray: '8, 8',
                        opacity: 0.85
                      }}
                    >
                      <Tooltip sticky>
                        <span className="font-mono text-xs text-purple-300 font-bold">
                          Fewest-Edges Route (BFS Comparison)
                        </span>
                      </Tooltip>
                    </Polyline>
                  )}

                  {/* 3. Calculated Optimal Route (Glowing Cyan / Emerald Polyline) */}
                  {routeResult && routeResult.is_reachable && routeResult.path_coordinates.length > 1 && (
                    <>
                      {/* Outer Glow */}
                      <Polyline
                        positions={routeResult.path_coordinates}
                        pathOptions={{
                          color: '#065f46',
                          weight: 10,
                          opacity: 0.5
                        }}
                      />
                      {/* Inner High-Visibility Line */}
                      <Polyline
                        positions={routeResult.path_coordinates}
                        pathOptions={{
                          color: '#10b981', // emerald-500
                          weight: 5,
                          opacity: 0.95
                        }}
                      >
                        <Tooltip sticky>
                          <div className="font-mono text-xs bg-emerald-950 text-emerald-200 p-1.5 rounded border border-emerald-500">
                            <div className="font-bold text-emerald-300">DIJKSTRA OPTIMAL PATH</div>
                            <div>Total: {routeResult.total_distance_km} km | Cost: {routeResult.total_weighted_cost}</div>
                            <div>Duration: ~{routeResult.estimated_duration_minutes} mins</div>
                          </div>
                        </Tooltip>
                      </Polyline>
                    </>
                  )}

                  {/* 4. Map Node Markers */}
                  {network?.nodes.map(node => {
                    const isOrigin = node.code === startNode;
                    const isDestination = node.code === endNode;
                    const isPathNode = pathNodeSet.has(node.code);

                    return (
                      <Marker
                        key={`node-${node.code}`}
                        position={[node.latitude, node.longitude]}
                        icon={createNodeIcon(node, isOrigin, isDestination, isPathNode)}
                        eventHandlers={{
                          click: () => {
                            if (!startNode || (startNode && endNode)) {
                              setStartNode(node.code);
                            } else if (startNode && !endNode && startNode !== node.code) {
                              setEndNode(node.code);
                            }
                          }
                        }}
                      >
                        <Popup className="custom-leaflet-popup">
                          <div className="p-2 space-y-1.5 font-sans text-xs bg-slate-900 text-slate-100 rounded">
                            <div className="font-bold text-teal-400 font-mono text-sm">{node.code}</div>
                            <div className="text-slate-300 font-medium">{node.name}</div>
                            <div className="text-[11px] text-slate-400">{node.description || node.node_type}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Lat: {node.latitude.toFixed(4)}, Lng: {node.longitude.toFixed(4)}
                            </div>
                            <div className="flex gap-1.5 pt-2 border-t border-slate-800">
                              <button
                                onClick={() => setStartNode(node.code)}
                                className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded text-[10px] font-semibold hover:bg-emerald-900"
                              >
                                Set as Origin
                              </button>
                              <button
                                onClick={() => setEndNode(node.code)}
                                className="px-2 py-1 bg-red-950 text-red-300 border border-red-600 rounded text-[10px] font-semibold hover:bg-red-900"
                              >
                                Set as Destination
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}

              {/* Floating Map Tactical HUD: Dijkstra Minimum Cost Overlay */}
              {routeResult && routeResult.is_reachable && (
                <div className="absolute top-3 right-3 z-[1000] bg-slate-950/95 border-2 border-amber-500/70 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-auto max-w-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300">
                        DIJKSTRA MINIMUM COST
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      OPTIMAL
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-black font-mono text-amber-200">
                    {routeResult.minimum_cost ?? routeResult.total_weighted_cost}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {routeResult.cost_metric || 'units'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono text-slate-300 border-t border-slate-800 pt-1.5">
                    <div>
                      Distance: <span className="text-teal-400 font-bold">{routeResult.total_distance_km} km</span>
                    </div>
                    <div>
                      Est: <span className="text-emerald-400 font-bold">₹{routeResult.estimated_operational_cost_inr?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-emerald-500 inline-block rounded"></span>
                  <span className="text-slate-300">Dijkstra Shortest Route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-purple-500 border-dashed inline-block rounded"></span>
                  <span className="text-purple-300">BFS Route (Comparison)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-sky-400 inline-block rounded"></span>
                  <span>Clear Road</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-amber-500 inline-block rounded"></span>
                  <span>Degraded Road</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-red-500 inline-block rounded"></span>
                  <span className="text-red-400 font-semibold">Blocked Road</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">
                  SRC: {startNode}
                </span>
                <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-500/30">
                  DST: {endNode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Route Calculation KPIs & Status */}
      {routeResult && (
        <div className="space-y-4">
          {/* Unreachable Warning Alert */}
          {!routeResult.is_reachable && (
            <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-200">
                  DESTINATION IS UNREACHABLE FROM ORIGIN
                </h4>
                <p className="text-xs text-red-300/90 mt-1">
                  Dijkstra priority queue exhausted all traversable components. All corridors connecting{' '}
                  <span className="font-mono font-bold">{routeResult.start_node}</span> to{' '}
                  <span className="font-mono font-bold">{routeResult.end_node}</span> are currently blocked or disconnected.
                </p>
                {routeResult.hazard_warnings.map((w, idx) => (
                  <div key={idx} className="mt-2 text-xs font-mono text-red-400 flex items-center gap-1.5">
                    <span>&bull;</span> {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minimum Cost Summary Banner */}
          {routeResult.is_reachable && (
            <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-teal-950/60 border border-amber-500/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DIJKSTRA GLOBAL MINIMUM
                    </span>
                    <span className="text-xs text-slate-400">Optimal Path Verified</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-200 mt-0.5">
                    Minimum Route Cost: <span className="text-amber-300 text-xl font-black">{routeResult.minimum_cost ?? routeResult.total_weighted_cost}</span> <span className="text-xs font-normal text-slate-400">({routeResult.cost_metric || 'units'})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-300 bg-slate-950/60 px-4 py-2 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">TOTAL DISTANCE</span>
                  <span className="text-teal-300 font-bold text-sm">{routeResult.total_distance_km} km</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block text-[10px]">EST. DISPATCH</span>
                  <span className="text-emerald-300 font-bold text-sm">₹{routeResult.estimated_operational_cost_inr?.toLocaleString() || '0'}</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block text-[10px]">FUEL CONSUMPTION</span>
                  <span className="text-cyan-300 font-bold text-sm">{routeResult.estimated_fuel_liters || 0} L</span>
                </div>
              </div>
            </div>
          )}

          {/* Solved Route KPI Grid */}
          {routeResult.is_reachable && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-slate-900 border-2 border-amber-500/50 rounded-xl p-4 shadow-lg shadow-amber-950/30 relative overflow-hidden">
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                  <span>Minimum Route Cost</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                  {routeResult.minimum_cost ?? routeResult.total_weighted_cost}
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5 font-mono">
                  {routeResult.cost_metric || 'Weighted units'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Physical Distance</span>
                  <Gauge className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {routeResult.total_distance_km} <span className="text-xs font-normal text-slate-400">km</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Cumulative road lengths</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Est. Convoy Duration</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {routeResult.estimated_duration_minutes} <span className="text-xs font-normal text-slate-400">mins</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Speed-adjusted travel time</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Est. Fuel Cost</span>
                  <span className="text-xs font-mono text-emerald-400">₹ INR</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  ₹{routeResult.estimated_operational_cost_inr ? routeResult.estimated_operational_cost_inr.toLocaleString() : '0'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {routeResult.estimated_fuel_liters || 0} L diesel
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Traversed Corridors</span>
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                  {routeResult.path.length - 1} <span className="text-xs font-normal text-slate-400">hops</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{routeResult.path.length} waypoints</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Dijkstra Runtime</span>
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  {routeResult.execution_time_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{routeResult.visited_nodes_count} nodes popped</div>
              </div>
            </div>
          )}

          {/* Academic Contrast: BFS vs Dijkstra Comparison Card */}
          {routeResult.alternative_route_comparison && (
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    ACADEMIC PROOF: DIJKSTRA != BFS
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">
                    Fewest-Edges Route (BFS) vs Shortest Weighted Route (Dijkstra)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-purple-400">
                  {routeResult.alternative_route_comparison.total_edges} edge hop(s) vs {routeResult.path.length - 1} edge hop(s)
                </span>
              </div>
              <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
                {routeResult.alternative_route_comparison.explanation}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 border-t border-purple-500/20 pt-2">
                <div>
                  <span className="text-purple-400">BFS Path:</span> {routeResult.alternative_route_comparison.path.join(' \u2192 ')} (
                  {routeResult.alternative_route_comparison.total_distance_km} km)
                </div>
                <div>
                  <span className="text-emerald-400">Dijkstra Path:</span> {routeResult.path.join(' \u2192 ')} (
                  {routeResult.total_distance_km} km, cost {routeResult.total_weighted_cost})
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Tabbed Deep-Dive: Turn-by-Turn Corridor Analysis / Priority Queue Trace / Road Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-800 bg-slate-950/60">
          <button
            onClick={() => setActiveTab('corridors')}
            className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'corridors'
                ? 'border-teal-500 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            Turn-by-Turn Route Corridors
            {routeResult?.path_details && routeResult.path_details.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300">
                {routeResult.path_details.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'theory'
                ? 'border-teal-500 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Priority Queue & Min-Heap Trace
            {routeResult?.step_by_step_trace && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">
                {routeResult.step_by_step_trace.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('road_editor')}
            className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'road_editor'
                ? 'border-teal-500 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Operator Road Blockade Management
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {network?.edges.filter(e => e.is_blocked).length || 0} Blocked
            </span>
          </button>
        </div>

        <div className="p-5">
          {/* Tab 1: Turn-by-Turn Route Corridors */}
          {activeTab === 'corridors' && (
            <div className="space-y-4">
              {!routeResult ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  Select Origin and Destination and click &quot;Calculate Optimal Route&quot; to inspect turn-by-turn road corridors.
                </div>
              ) : routeResult.path_details.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  {routeResult.start_node === routeResult.end_node
                    ? 'Origin is identical to Destination. Zero corridor transit required.'
                    : 'No traversable corridors to display.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Corridor Segment</th>
                        <th className="py-2.5 px-3">Road Name & Type</th>
                        <th className="py-2.5 px-3">Distance (km)</th>
                        <th className="py-2.5 px-3">Condition Mult</th>
                        <th className="py-2.5 px-3">Risk Rating</th>
                        <th className="py-2.5 px-3 text-amber-300">Segment Cost</th>
                        <th className="py-2.5 px-3 text-amber-400">Cumulative Min-Cost</th>
                        <th className="py-2.5 px-3">Convoy Speed</th>
                        <th className="py-2.5 px-3">Est. Time</th>
                        <th className="py-2.5 px-3">Hazard Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {routeResult.path_details.map((seg, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            {seg.from_node} &rarr; {seg.to_node}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            <div>{seg.road_name}</div>
                            <span className="text-[10px] text-slate-500 uppercase">{seg.road_type}</span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-teal-300">{seg.distance_km} km</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              seg.condition_multiplier > 1.3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              x{seg.condition_multiplier}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              seg.risk_factor > 2.0
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {seg.risk_factor} / 5.0
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                            {seg.segment_cost !== undefined ? seg.segment_cost : seg.distance_km}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-amber-400">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                              {seg.cumulative_cost !== undefined ? seg.cumulative_cost : '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-cyan-300">{seg.estimated_speed_kmh} km/h</td>
                          <td className="py-2.5 px-3 font-bold text-slate-200">{seg.segment_time_mins} min</td>
                          <td className="py-2.5 px-3 font-sans">
                            {seg.hazard_warning ? (
                              <span className="text-amber-400 text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {seg.hazard_warning}
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                Clear Passage
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200 text-xs">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-slate-400">
                          DIJKSTRA MINIMUM TOTALS:
                        </td>
                        <td className="py-3 px-3 text-teal-300 font-mono font-bold">
                          {routeResult.total_distance_km} km
                        </td>
                        <td colSpan={2}></td>
                        <td className="py-3 px-3 text-amber-300 font-mono font-bold">
                          {routeResult.minimum_cost ?? routeResult.total_weighted_cost}
                        </td>
                        <td className="py-3 px-3 text-amber-300 font-mono font-black text-sm bg-amber-500/20 border border-amber-500/40">
                          {routeResult.minimum_cost ?? routeResult.total_weighted_cost} <span className="text-[10px] font-normal text-slate-400">({routeResult.cost_metric || 'units'})</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">Avg Convoy</td>
                        <td className="py-3 px-3 font-mono text-cyan-300">
                          {routeResult.estimated_duration_minutes} min
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                          Est: ₹{routeResult.estimated_operational_cost_inr ? routeResult.estimated_operational_cost_inr.toLocaleString() : '0'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Priority Queue & Min-Heap Trace */}
          {activeTab === 'theory' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  Dijkstra Mathematical Relaxation Principle
                </div>
                <div className="font-mono text-xs text-teal-300 bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed">
                  if dist[u] + weight(u, v) &lt; dist[v]:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;dist[v] = dist[u] + weight(u, v)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;prev[v] = (u, edge_used)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;heapq.heappush(pq, (dist[v], v))
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Using a binary min-heap priority queue, each vertex extraction takes O(log V) time, and each edge relaxation
                  takes O(log V) time, resulting in overall time complexity of O((V + E) log V).
                </p>
              </div>

              {routeResult?.step_by_step_trace && routeResult.step_by_step_trace.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Step</th>
                        <th className="py-2 px-3">Popped Node</th>
                        <th className="py-2 px-3">Current Cost</th>
                        <th className="py-2 px-3">Action Type</th>
                        <th className="py-2 px-3">Target / Relaxed</th>
                        <th className="py-2 px-3">Tentative Cost</th>
                        <th className="py-2 px-3">Decision Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {routeResult.step_by_step_trace.map((step, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-500 font-bold">{step.step_num}</td>
                          <td className="py-2 px-3 font-semibold text-teal-300">{step.popped_node}</td>
                          <td className="py-2 px-3 font-mono text-slate-200">{step.current_cost}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step.action === 'TARGET_REACHED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : step.action === 'RELAX_EDGE'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {step.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-indigo-300">{step.relaxed_node || '-'}</td>
                          <td className="py-2 px-3 text-amber-300">{step.tentative_cost !== undefined ? step.tentative_cost : '-'}</td>
                          <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{step.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  Execute route solver to generate step-by-step min-heap trace.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Operator Road Blockade Management */}
          {activeTab === 'road_editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Emergency Road Corridor Inventory & Dynamic Closures
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized operators can report landslide blockages, bridge collapses, or clear reopened corridors.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Total Corridors: {network?.edges.length || 0}
                </span>
              </div>

              {selectedRoad && (
                <div className="p-4 bg-slate-950 border border-teal-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-400">{selectedRoad.id}</span>
                      <span className="text-sm font-semibold text-slate-100">{selectedRoad.road_name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedRoad(null)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      &times; Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Link:</span>
                      <span className="text-slate-200">{selectedRoad.source} &harr; {selectedRoad.target}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Distance:</span>
                      <span className="text-slate-200">{selectedRoad.distance_km} km</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Condition Penalty:</span>
                      <span className="text-slate-200">x{selectedRoad.condition_multiplier}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hazard Risk:</span>
                      <span className="text-slate-200">{selectedRoad.risk_factor} / 5.0</span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRoad(selectedRoad.id || '')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        selectedRoad.is_blocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      }`}
                    >
                      {selectedRoad.is_blocked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          REOPEN CORRIDOR (CLEAR BLOCKAGE)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          REPORT CORRIDOR BLOCKED (LANDSLIDE / FLOOD)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Road ID</th>
                      <th className="py-2.5 px-3">Corridor</th>
                      <th className="py-2.5 px-3">Road Name</th>
                      <th className="py-2.5 px-3">Distance</th>
                      <th className="py-2.5 px-3">Condition Mult</th>
                      <th className="py-2.5 px-3">Risk Rating</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Operator Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {network?.edges.map(edge => (
                      <tr
                        key={edge.id || `${edge.source}-${edge.target}`}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          edge.is_blocked ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-400">{edge.id || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          {edge.source} &harr; {edge.target}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{edge.road_name || 'Corridor'}</td>
                        <td className="py-2.5 px-3 font-mono">{edge.distance_km} km</td>
                        <td className="py-2.5 px-3 font-mono">x{edge.condition_multiplier}</td>
                        <td className="py-2.5 px-3 font-mono">{edge.risk_factor}</td>
                        <td className="py-2.5 px-3">
                          {edge.is_blocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              BLOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              OPEN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleRoad(edge.id || '')}
                            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                              edge.is_blocked
                                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
                                : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-600'
                            }`}
                          >
                            {edge.is_blocked ? 'Clear Blockage' : 'Block Road'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorRouteMapView;
