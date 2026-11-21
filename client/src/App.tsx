import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Gauge,
  Globe,
  LayoutDashboard,
  MapPin,
  Package,
  Play,
  RefreshCw,
  Route,
  ShieldCheck,
  Truck,
  Weight,
  Zap,
} from "lucide-react";

type Location = { id: string; x: number; y: number };
type Order = {
  id: string;
  machine: string;
  weight: number;
  pickup: string;
  delivery: string;
};
type Vehicle = { id: string; name: string; capacity: number; maxItems: number };
type Action = {
  orderId: string;
  machine: string;
  type: "PICKUP" | "DELIVERY";
  location: string;
  weight: number;
  loadAfter: number;
  itemsAfter: number;
  distanceFromPrevious: number;
  elapsedMinutes: number;
};
type Plan = {
  vehicle: Vehicle;
  actions: Action[];
  route: string[];
  distanceKm: number;
  workMinutes: number;
  orderCount: number;
};
type Result = {
  feasible: boolean;
  plans: Plan[];
  totalDistanceKm: number;
  completedOrders: number;
  warnings: string[];
  algorithm: string;
  valid: boolean;
};
const API = import.meta.env.DEV ? "http://localhost:4000" : "";
const fmt = (n: number) =>
  new Intl.NumberFormat("hr-HR", { maximumFractionDigits: 1 }).format(n);
const mins = (n: number) => `${Math.floor(n / 60)}h ${Math.round(n % 60)}m`;
const variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
function App() {
  const [orders, setOrders] = useState<Order[]>([]),
    [locations, setLocations] = useState<Location[]>([]),
    [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [result, setResult] = useState<Result | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [tab, setTab] = useState("Overview"),
    [activeTruck, setActiveTruck] = useState("A");
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("up-rent-language");
    return saved === "hr" ? "hr" : "en";
  });
  useEffect(
    () => localStorage.setItem("up-rent-language", language),
    [language],
  );
  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders);
        setLocations(d.locations);
        setVehicles(d.vehicles);
      })
      .catch(() =>
        setError("Backend nije dostupan. Pokrenite API na portu 4000."),
      );
  }, []);
  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw Error("Greška pri optimizaciji");
      const next: Result = await r.json();
      if (!next.plans?.length) throw Error("Nema izvedivog plana");
      setResult(next);
      setActiveTruck(next.plans[0].vehicle.id);
      setTab("Route optimization");
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : "Ne mogu dohvatiti rezultat optimizacije. Provjerite je li backend pokrenut.",
      );
    } finally {
      setLoading(false);
    }
  };
  const selected = result?.plans.find((p) => p.vehicle.id === activeTruck);
  const totalOrders = result?.completedOrders ?? 0;
  const nav = [
    ["Overview", LayoutDashboard],
    ["Transport orders", Package],
    ["Fleet", Truck],
    ["Route optimization", Route],
    ["Validation", ShieldCheck],
  ] as const;
  const t = (key: keyof typeof translations.en) => translations[language][key];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Command size={19} />
          </div>
          <div>
            <b>UP ROUTE</b>
            <span>LOGISTICS OS</span>
          </div>
        </div>
        <div className="workspace">
          <div className="workspace-icon">UR</div>
          <div>
            <b>{t("workspaceLabel")}</b>
            <span>{t("demo")}</span>
          </div>
          <ChevronRight size={15} />
        </div>
        <div className="nav-label">{t("workspace")}</div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item ${tab === name ? "active" : ""}`}
              onClick={() => setTab(name)}
            >
              <Icon size={17} />
              <span>
                {name === "Overview"
                  ? t("overview")
                  : name === "Transport orders"
                    ? t("orders")
                    : name === "Fleet"
                      ? t("fleet")
                      : name === "Route optimization"
                        ? t("route")
                        : t("validation")}
              </span>
              {name === "Route optimization" && result && (
                <i className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-line">
            <span className="live-dot" /> {t("operational")}
          </div>
          <div className="language-control">
            <Globe size={15} />
            <span>{t("language")}</span>
            <div
              className="language-options"
              role="group"
              aria-label="Language"
            >
              <button
                className={language === "en" ? "selected" : ""}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                className={language === "hr" ? "selected" : ""}
                onClick={() => setLanguage("hr")}
              >
                HR
              </button>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">UP</div>
            <div>
              <b>UP RENT Team</b>
              <span>{t("administrator")}</span>
            </div>
            <CircleHelp size={16} />
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            {t("workspaceLabel")} <ChevronRight size={13} />{" "}
            <b>
              {tab === "Overview"
                ? t("overview")
                : tab === "Transport orders"
                  ? t("orders")
                  : tab === "Fleet"
                    ? t("fleet")
                    : tab === "Route optimization"
                      ? t("route")
                      : t("validation")}
            </b>
          </div>
          <div className="top-actions">
            <span className="date-label">{t("smartPlanner")}</span>
            <div className="top-avatar">UP</div>
          </div>
        </header>
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -8 }}
              variants={variants}
              transition={{ duration: 0.28 }}
              className="page"
            >
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> {t("operations")}
                  </div>
                  <h1>
                    {tab === "Overview"
                      ? t("goodMorning")
                      : tab === "Transport orders"
                        ? t("orders")
                        : tab === "Fleet"
                          ? t("fleetOverview")
                          : tab === "Route optimization"
                            ? t("route")
                            : t("businessValidation")}
                  </h1>
                  <p>
                    {tab === "Overview" ? t("overviewCopy") : t("generalCopy")}
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={run}
                  disabled={loading || !orders.length}
                >
                  <Play size={15} fill="currentColor" />
                  {loading ? t("optimizing") : t("run")}
                  <span className="btn-shine" />
                </button>
              </div>
              {error && <div className="alert error">{error}</div>}
              {tab === "Overview" && (
                <>
                  <div className="metric-grid">
                    <Metric
                      icon={<Package />}
                      label={t("transportOrders")}
                      value={String(orders.length || "—")}
                      note={t("activeRequests")}
                      color="blue"
                    />
                    <Metric
                      icon={<Truck />}
                      label={t("availableVehicles")}
                      value={String(vehicles.length || "—")}
                      note={t("fleetReady")}
                      color="purple"
                    />
                    <Metric
                      icon={<Route />}
                      label={t("totalDistance")}
                      value={result ? `${fmt(result.totalDistanceKm)} km` : "—"}
                      note={result ? t("roundTrip") : t("calculate")}
                      color="cyan"
                    />
                    <Metric
                      icon={<CheckCircle2 />}
                      label={t("completedOrders")}
                      value={result ? `${totalOrders}/10` : "—"}
                      note={result?.valid ? t("constraints") : t("awaiting")}
                      color="green"
                    />
                  </div>
                  <div className="section-row">
                    <div>
                      <h2>{t("fleetPerformance")}</h2>
                      <p>{t("liveCapacity")}</p>
                    </div>
                    <button
                      className="text-btn"
                      onClick={() => setTab("Fleet")}
                    >
                      {t("viewFleet")} <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="fleet-grid">
                    {vehicles.map((v, i) => (
                      <FleetCard
                        key={v.id}
                        vehicle={v}
                        plan={result?.plans.find((p) => p.vehicle.id === v.id)}
                        index={i}
                        language={language}
                      />
                    ))}
                  </div>
                  <div className="lower-grid">
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <h3>{t("recentOrders")}</h3>
                          <p>{t("incoming")}</p>
                        </div>
                        <button
                          className="icon-btn"
                          onClick={() => setTab("Transport orders")}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>
                      <OrdersTable
                        orders={orders.slice(0, 5)}
                        compact
                        language={language}
                      />
                    </div>
                    <div className="panel optimizer-panel">
                      <div className="panel-head">
                        <div>
                          <h3>{t("engine")}</h3>
                          <p>{t("engineCopy")}</p>
                        </div>
                        <div className="engine-icon">
                          <Zap size={17} />
                        </div>
                      </div>
                      <div className="engine-visual">
                        <div className="engine-ring">
                          <div>
                            <Route size={25} />
                            <b>
                              {result
                                ? `${fmt(result.totalDistanceKm)}`
                                : t("ready")}
                            </b>
                            <span>
                              {result ? t("totalKm") : t("awaitingRun")}
                            </span>
                          </div>
                        </div>
                        <div className="engine-lines">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                      <div className="engine-footer">
                        <span>
                          <i className="live-dot" /> {t("engineReady")}
                        </span>
                        <span>Beam search · v1.0</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {tab === "Transport orders" && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>{t("allOrders")}</h3>
                      <p>{t("ordersCopy")}</p>
                    </div>
                    <span className="pill">
                      {orders.length} {t("ordersCount")}
                    </span>
                  </div>
                  <OrdersTable orders={orders} language={language} />
                </div>
              )}
              {tab === "Fleet" && (
                <div className="fleet-grid fleet-large">
                  {vehicles.map((v, i) => (
                    <FleetCard
                      key={v.id}
                      vehicle={v}
                      plan={result?.plans.find((p) => p.vehicle.id === v.id)}
                      index={i}
                      language={language}
                    />
                  ))}
                </div>
              )}
              {tab === "Route optimization" && (
                <>
                  {!result ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Route size={28} />
                      </div>
                      <h2>{t("readyRoutes")}</h2>
                      <p>{t("readyRoutesCopy")}</p>
                      <button
                        className="primary-btn"
                        onClick={run}
                        disabled={loading}
                      >
                        <Play size={15} fill="currentColor" />{" "}
                        {loading ? t("optimizing") : t("startOptimization")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="result-banner">
                        <div className="success-icon">
                          <Check size={19} />
                        </div>
                        <div>
                          <b>
                            {result.valid
                              ? t("optimizationCompleted")
                              : t("optimizationAttention")}
                          </b>
                          <span>{result.algorithm}</span>
                        </div>
                        <div className="banner-distance">
                          <b>{fmt(result.totalDistanceKm)} km</b>
                          <span>{t("combinedDistance")}</span>
                        </div>
                      </div>
                      <div className="route-summary">
                        <Metric
                          icon={<Route />}
                          label={t("totalDistance")}
                          value={`${fmt(result.totalDistanceKm)} km`}
                          note={t("bothVehicles")}
                          color="cyan"
                        />
                        <Metric
                          icon={<Package />}
                          label={t("ordersAssigned")}
                          value={`${result.completedOrders}/10`}
                          note={t("pickupDelivery")}
                          color="blue"
                        />
                        <Metric
                          icon={<Clock3 />}
                          label={t("fleetWorkTime")}
                          value={mins(
                            result.plans.reduce((s, p) => s + p.workMinutes, 0),
                          )}
                          note={t("drivingService")}
                          color="purple"
                        />
                      </div>
                      <div className="route-layout">
                        <div className="panel map-panel">
                          <div className="panel-head">
                            <div>
                              <h3>{t("routeVisualization")}</h3>
                              <p>{t("routeMapCopy")}</p>
                            </div>
                            <span className="pill">{t("simulatedMap")}</span>
                          </div>
                          <RouteMap
                            locations={locations}
                            plans={result.plans}
                            activeTruck={activeTruck}
                            onTruckSelect={setActiveTruck}
                            language={language}
                          />
                          <div className="map-legend">
                            <span>
                              <i className="legend-a" /> {t("truckA")}
                            </span>
                            <span>
                              <i className="legend-b" /> {t("truckB")}
                            </span>
                            <span>
                              <i className="legend-base" /> {t("depot")}
                            </span>
                          </div>
                        </div>
                        <div className="panel">
                          <div className="panel-head">
                            <div>
                              <h3>{t("vehicleRoutes")}</h3>
                              <p>{t("stopByStop")}</p>
                            </div>
                          </div>
                          <div className="truck-tabs">
                            {result.plans.map((p) => (
                              <button
                                className={
                                  activeTruck === p.vehicle.id ? "selected" : ""
                                }
                                onClick={() => setActiveTruck(p.vehicle.id)}
                                key={p.vehicle.id}
                              >
                                {p.vehicle.name}
                              </button>
                            ))}
                          </div>
                          {selected && (
                            <>
                              <div className="route-stats">
                                <div>
                                  <span>{t("distance")}</span>
                                  <b>{fmt(selected.distanceKm)} km</b>
                                </div>
                                <div>
                                  <span>{t("workTime")}</span>
                                  <b>{mins(selected.workMinutes)}</b>
                                </div>
                                <div>
                                  <span>{t("ordersLabel")}</span>
                                  <b>{selected.orderCount}</b>
                                </div>
                              </div>
                              <div className="timeline">
                                <div className="timeline-stop base">
                                  <div className="timeline-marker">
                                    <MapPin size={13} />
                                  </div>
                                  <div>
                                    <b>{t("base")} · L0</b>
                                    <span>{t("departure")}</span>
                                  </div>
                                </div>
                                {selected.actions.map((a, i) => (
                                  <div
                                    className="timeline-stop"
                                    key={`${a.orderId}-${a.type}-${i}`}
                                  >
                                    <div
                                      className={`timeline-marker ${a.type === "PICKUP" ? "pickup" : "delivery"}`}
                                    >
                                      {a.type === "PICKUP" ? (
                                        <ArrowDownRight size={13} />
                                      ) : (
                                        <ArrowUpRight size={13} />
                                      )}
                                    </div>
                                    <div className="stop-main">
                                      <b>
                                        {a.type === "PICKUP"
                                          ? t("pickup")
                                          : t("deliver")}{" "}
                                        · {a.location}
                                      </b>
                                      <span>
                                        {a.orderId} / {a.machine} ·{" "}
                                        {fmt(a.weight)} kg
                                      </span>
                                      <small>
                                        {t("loadAfter")}: {fmt(a.loadAfter)} kg
                                        · {a.itemsAfter} {t("items")}
                                      </small>
                                    </div>
                                    <time>{mins(a.elapsedMinutes)}</time>
                                  </div>
                                ))}
                                <div className="timeline-stop base">
                                  <div className="timeline-marker">
                                    <MapPin size={13} />
                                  </div>
                                  <div>
                                    <b>{t("base")} · L0</b>
                                    <span>{t("returnDepot")}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              {tab === "Validation" && (
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>{t("constraintValidation")}</h3>
                      <p>{t("constraintCopy")}</p>
                    </div>
                    <span
                      className={`pill ${result?.valid ? "pill-green" : ""}`}
                    >
                      {result
                        ? result.valid
                          ? t("allChecksPassed")
                          : t("reviewRequired")
                        : t("notRun")}
                    </span>
                  </div>
                  {(result
                    ? [
                        t("checkAssigned"),
                        t("checkPickup"),
                        t("checkVehicle"),
                        t("checkPayload"),
                        t("checkMachines"),
                        t("checkBase"),
                        t("checkWorkTime"),
                      ]
                    : [
                        t("checkAssignedOnce"),
                        t("checkPickupVehicle"),
                        t("checkLimits"),
                        t("checkBaseTime"),
                      ]
                  ).map((s) => (
                    <div className="check-row" key={s}>
                      <div
                        className={`check-icon ${result ? "passed" : "pending"}`}
                      >
                        {result ? <Check size={14} /> : <Clock3 size={14} />}
                      </div>
                      <span>{s}</span>
                      <b>{result ? t("pass") : t("pending")}</b>
                    </div>
                  ))}
                  {result?.warnings.map((w, i) => (
                    <div className="alert error" key={i}>
                      {w}
                    </div>
                  ))}
                  {!result && (
                    <button className="primary-btn validate-btn" onClick={run}>
                      <Play size={14} /> {t("runValidation")}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <footer>
            <span>© 2026 UP RENT · {t("smartPlanner")}</span>
            <span>
              <i className="live-dot" /> {t("allSystemsNormal")}
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <motion.div
      className="metric-card"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="metric-top">
        <span>{label}</span>
        <div className={`metric-icon ${color}`}>{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </motion.div>
  );
}
function FleetCard({
  vehicle,
  plan,
  index,
  language,
}: {
  vehicle: Vehicle;
  plan?: Plan;
  index: number;
  language: Language;
}) {
  const tr = translations[language];
  const pct = plan
    ? Math.min(
        100,
        (plan.actions.reduce((m, a) => Math.max(m, a.loadAfter), 0) /
          vehicle.capacity) *
          100,
      )
    : 0;
  return (
    <motion.div
      className="fleet-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="fleet-card-top">
        <div className={`truck-symbol truck-${vehicle.id}`}>
          <Truck size={21} />
        </div>
        <div className="fleet-name">
          <b>{vehicle.name}</b>
          <span>
            {tr.heavyDuty} · {vehicle.id}
          </span>
        </div>
        <span className={`status-tag ${plan ? "assigned" : "available"}`}>
          {plan ? tr.assigned : tr.available}
        </span>
      </div>
      <div className="fleet-numbers">
        <div>
          <span>{tr.maxPayload}</span>
          <b>
            {fmt(vehicle.capacity)} <small>kg</small>
          </b>
        </div>
        <div>
          <span>{tr.maxMachines}</span>
          <b>
            {vehicle.maxItems} <small>{tr.units}</small>
          </b>
        </div>
      </div>
      <div className="capacity-label">
        <span>{tr.peakPayload}</span>
        <b>{plan ? `${fmt(pct)}%` : "—"}</b>
      </div>
      <div className="capacity-track">
        <motion.div
          className={`capacity-fill fill-${vehicle.id}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="fleet-card-bottom">
        <span>
          <Route size={13} />{" "}
          {plan ? `${fmt(plan.distanceKm)} km ${tr.routeSuffix}` : tr.noRoute}
        </span>
        <span>
          <Clock3 size={13} /> {plan ? mins(plan.workMinutes) : "—"}
        </span>
      </div>
    </motion.div>
  );
}
function OrdersTable({
  orders,
  compact = false,
  language,
}: {
  orders: Order[];
  compact?: boolean;
  language: Language;
}) {
  const tr = translations[language];
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{tr.order}</th>
            <th>{tr.machine}</th>
            <th>{tr.weight}</th>
            <th>{tr.pickupLocation}</th>
            <th>{tr.deliveryLocation}</th>
            {!compact && <th>{tr.status}</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b className="order-id">{o.id}</b>
              </td>
              <td>{o.machine}</td>
              <td>{fmt(o.weight)} kg</td>
              <td>
                <span className="location-chip">
                  <MapPin size={11} />
                  {o.pickup}
                </span>
              </td>
              <td>
                <span className="location-chip">
                  <MapPin size={11} />
                  {o.delivery}
                </span>
              </td>
              {!compact && (
                <td>
                  <span className="status-tag available">READY</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function RouteMap({
  locations,
  plans,
  activeTruck,
  onTruckSelect,
  language,
}: {
  locations: Location[];
  plans: Plan[];
  activeTruck: string;
  onTruckSelect: (id: string) => void;
  language: Language;
}) {
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const x = (v: number) => 35 + ((v + 10) / 40) * 470,
    y = (v: number) => 260 - ((v + 10) / 30) * 220;
  const colors = ["#45b8ff", "#a78bfa"];
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setProgress((p) => (p >= 100 ? 0 : p + 0.22 * speed)),
      55,
    );
    return () => window.clearInterval(timer);
  }, [running, speed]);
  const pointAt = (p: Plan) => {
    const pts = [
      locations.find((l) => l.id === "L0")!,
      ...p.actions.map((a) => locations.find((l) => l.id === a.location)!),
      locations.find((l) => l.id === "L0")!,
    ].filter(Boolean);
    if (pts.length < 2) return { x: 270, y: 130, heading: 0 };
    const pct = Math.min(0.999, (progress / 100) * 1);
    const pos = pct * (pts.length - 1),
      i = Math.floor(pos),
      t = pos - i,
      a = pts[i],
      b = pts[Math.min(i + 1, pts.length - 1)];
    return {
      x: x(a.x) + (x(b.x) - x(a.x)) * t,
      y: y(a.y) + (y(b.y) - y(a.y)) * t,
      heading: Math.atan2(y(b.y) - y(a.y), x(b.x) - x(a.x)) * (180 / Math.PI),
    };
  };
  const tr = translations[language];
  const active = plans.find((p) => p.vehicle.id === activeTruck) || plans[0];
  const activeIndex = Math.max(
    0,
    plans.findIndex((p) => p.vehicle.id === activeTruck),
  );
  const actionIndex = active?.actions.length
    ? Math.min(
        active.actions.length - 1,
        Math.floor((progress / 100) * active.actions.length),
      )
    : 0;
  const stop = active?.actions[actionIndex];
  const nextStop = active?.actions[actionIndex + 1];
  const navInstruction =
    progress >= 100
      ? tr.routeComplete
      : tr.headToward + " " + (stop?.location || "L0");
  const navAction = stop
    ? stop.type === "PICKUP"
      ? tr.pickUpAction
      : tr.deliverAction
    : tr.start;
  const navDistance = stop?.distanceFromPrevious
    ? `${fmt(stop.distanceFromPrevious)} km`
    : tr.atBase;
  const etaMinutes = active?.workMinutes
    ? Math.max(1, Math.round(active.workMinutes * (1 - progress / 100)))
    : 0;
  const truckMarker = (
    id: string,
    pos: { x: number; y: number; heading: number },
    color: string,
  ) => {
    const selected = activeTruck === id;
    const truckName =
      plans.find((p) => p.vehicle.id === id)?.vehicle.name || id;
    return (
      <g
        transform={`translate(${pos.x} ${pos.y}) rotate(${pos.heading})`}
        key={id}
        className={`live-truck ${selected ? "selected" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`Select ${truckName}`}
        onClick={(event) => {
          event.stopPropagation();
          onTruckSelect(id);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onTruckSelect(id);
        }}
      >
        {selected && (
          <circle
            cx="0"
            cy="0"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity=".55"
            className="truck-selection-ring"
          />
        )}
        <ellipse cx="-1" cy="9" rx="14" ry="5" fill="#030713" opacity=".5" />
        <rect
          x="-15"
          y="-8"
          width="30"
          height="16"
          rx="5"
          fill="#101827"
          stroke={color}
          strokeWidth="2.2"
        />
        <rect x="-12" y="-6" width="15" height="12" rx="3" fill="#dce7f3" />
        <rect x="-9" y="-4" width="9" height="8" rx="2" fill="#6e91aa" />
        <path d="M-7 -3 L-2 -3 L-1 1 L-7 3 Z" fill="#9dd1ea" opacity=".9" />
        <rect
          x="4"
          y="-6"
          width="8"
          height="12"
          rx="2"
          fill={color}
          opacity=".95"
        />
        <rect
          x="6"
          y="-4"
          width="4"
          height="8"
          rx="1"
          fill="#eaf6ff"
          opacity=".75"
        />
        <rect x="-15" y="-4" width="3" height="8" rx="1.5" fill="#ffb35c" />
        <circle
          cx="-9"
          cy="9"
          r="3.2"
          fill="#080b12"
          stroke="#64748b"
          strokeWidth="1"
        />
        <circle
          cx="9"
          cy="9"
          r="3.2"
          fill="#080b12"
          stroke="#64748b"
          strokeWidth="1"
        />
        <circle
          cx="-9"
          cy="-9"
          r="3.2"
          fill="#080b12"
          stroke="#64748b"
          strokeWidth="1"
        />
        <circle
          cx="9"
          cy="-9"
          r="3.2"
          fill="#080b12"
          stroke="#64748b"
          strokeWidth="1"
        />
      </g>
    );
  };
  return (
    <div className="live-map">
      <svg viewBox="0 0 540 300" role="img" aria-label={tr.interactiveMap}>
        <defs>
          <pattern
            id="grid"
            width="27"
            height="27"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 27 0 L 0 0 0 27"
              fill="none"
              stroke="#314158"
              strokeWidth=".55"
              opacity=".45"
            />
          </pattern>
          <linearGradient id="mapWater" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#17354b" />
            <stop offset="1" stopColor="#10283a" />
          </linearGradient>
          <filter id="truckGlow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="540" height="300" fill="#0d1726" />
        <path
          d="M410 -20 C380 45 425 78 520 98 L560 98 L560 -20 Z"
          fill="url(#mapWater)"
          opacity=".9"
        />
        <g className="map-districts">
          <rect x="28" y="34" width="112" height="72" rx="8" />
          <rect x="158" y="24" width="96" height="54" rx="8" />
          <rect x="280" y="42" width="92" height="74" rx="8" />
          <rect x="55" y="176" width="122" height="74" rx="8" />
          <rect x="205" y="194" width="110" height="64" rx="8" />
          <rect x="336" y="178" width="82" height="92" rx="8" />
        </g>
        <rect width="540" height="300" fill="url(#grid)" />
        <g className="map-roads">
          <path
            className="road-major"
            d="M-20 105 C85 112 146 82 252 104 S402 132 560 82"
          />
          <path className="road-major" d="M72 -20 C64 70 112 130 86 320" />
          <path className="road-major" d="M205 -20 C188 75 252 154 238 320" />
          <path className="road-major" d="M372 -20 C346 70 414 155 390 320" />
          <path
            className="road-minor"
            d="M-20 244 C85 205 142 226 205 182 S326 126 560 214"
          />
          <path
            className="road-minor"
            d="M15 46 C110 58 152 42 218 53 S340 72 430 38"
          />
          <path
            className="road-minor"
            d="M22 166 C120 148 178 176 280 154 S410 126 530 148"
          />
        </g>
        <g className="map-labels">
          <text x="42" y="122">
            WEST HUB
          </text>
          <text x="260" y="88">
            INDUSTRIAL
          </text>
          <text x="392" y="252">
            EAST DOCK
          </text>
          <text x="92" y="214">
            SERVICE A
          </text>
        </g>
        {plans.map((p, pi) => {
          const pts = [
            locations.find((l) => l.id === "L0")!,
            ...p.actions.map(
              (a) => locations.find((l) => l.id === a.location)!,
            ),
            locations.find((l) => l.id === "L0")!,
          ].filter(Boolean);
          return (
            <g
              key={p.vehicle.id}
              onClick={() => onTruckSelect(p.vehicle.id)}
              className="route-group"
            >
              <polyline
                points={pts.map((p) => `${x(p.x)},${y(p.y)}`).join(" ")}
                fill="none"
                stroke={colors[pi]}
                strokeWidth={activeTruck === p.vehicle.id ? 3.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 7"
                opacity={activeTruck === p.vehicle.id ? 0.95 : 0.48}
                filter={
                  activeTruck === p.vehicle.id ? "url(#routeGlow)" : undefined
                }
              />
              {pts.slice(1, -1).map((p, i) => (
                <g key={i}>
                  <circle
                    cx={x(p.x)}
                    cy={y(p.y)}
                    r="5.5"
                    fill="#0b1120"
                    stroke={colors[pi]}
                    strokeWidth="2"
                  />
                  <circle cx={x(p.x)} cy={y(p.y)} r="1.8" fill={colors[pi]} />
                </g>
              ))}
            </g>
          );
        })}
        {locations.map((l) => (
          <g key={l.id}>
            <circle
              cx={x(l.x)}
              cy={y(l.y)}
              r={l.id === "L0" ? 9 : 4.5}
              fill={l.id === "L0" ? "#f59e0b" : "#1b2940"}
              stroke={l.id === "L0" ? "#fbbf24" : "#64748b"}
              strokeWidth="1.5"
            />
            <text
              x={x(l.x) + 9}
              y={y(l.y) - 8}
              fill="#aebbd0"
              fontSize="9"
              fontWeight="700"
            >
              {l.id}
            </text>
          </g>
        ))}
        {plans.map((p, pi) =>
          truckMarker(p.vehicle.id, pointAt(p), colors[pi]),
        )}
      </svg>
      <div className="hud-top">
        <div className="hud-status">
          <div className="hud-live">
            <i /> {tr.liveNavigation}
          </div>
          <div className="hud-weather">
            <span>18°C</span>
            <b>{tr.clearRoute}</b>
          </div>
        </div>
        <div className="hud-eta">
          <span>{tr.eta}</span>
          <b>{mins(etaMinutes)}</b>
        </div>
      </div>
      <div className="nav-card">
        <div className="nav-maneuver">
          <div className="nav-maneuver-icon" aria-hidden="true">
            <Route size={20} strokeWidth={2.4} />
          </div>
          <div className="nav-maneuver-copy">
            <span>{tr.nextManeuver}</span>
            <b>{navDistance}</b>
          </div>
        </div>
        <div className="nav-instruction">
          <b>{navInstruction}</b>
          <span>
            {navAction} · {stop?.orderId || tr.returnDepot}
          </span>
        </div>
        <div className="nav-lanes" aria-label="Suggested driving lanes">
          <i />
          <i className="active" />
          <i />
          <i />
        </div>
        <div className="nav-next">
          <span>{tr.then}</span>
          <b>
            {nextStop
              ? (nextStop.type === "PICKUP" ? tr.pickup : tr.deliver) +
                " " +
                tr.atLocation +
                " " +
                nextStop.location
              : tr.returnBase}
          </b>
        </div>
      </div>
      <div className="hud-bottom">
        <div className="hud-truck">
          <div className="hud-truck-icon">
            <Truck size={16} />
          </div>
          <div>
            <b>{active?.vehicle.name || tr.truck}</b>
            <span>
              {Math.round(48 + progress * 0.08)} km/h ·{" "}
              {progress < 100 ? tr.navigating : tr.arrived}
            </span>
          </div>
        </div>
        <div className="hud-progress">
          <div>
            <span>{tr.routeProgress}</span>
            <b>{Math.round(progress)}%</b>
          </div>
          <div className="hud-track">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="hud-controls">
          <button onClick={() => setProgress(0)} title={tr.restart}>
            <RefreshCw size={14} />
          </button>
          <button
            className="hud-play"
            onClick={() => setRunning((v) => !v)}
            title={running ? tr.pause : tr.startNavigation}
          >
            {running ? (
              <span className="pause-bars">
                <i />
                <i />
              </span>
            ) : (
              <Play size={15} fill="currentColor" />
            )}
          </button>
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            title={tr.speed}
          >
            {speed}×
          </button>
        </div>
      </div>
      <div className="weight-tracker">
        <div className="weight-tracker-icon">
          <Weight size={15} />
        </div>
        <div className="weight-tracker-copy">
          <span>{tr.currentWeight}</span>
          <b>{fmt(stop?.loadAfter ?? 0)} kg</b>
        </div>
        <div className="weight-tracker-bar">
          <i
            style={{
              width: `${
                active?.vehicle.capacity
                  ? Math.min(
                      100,
                      ((stop?.loadAfter ?? 0) / active.vehicle.capacity) * 100,
                    )
                  : 0
              }%`,
            }}
          />
        </div>
        <small>
          {active?.vehicle.capacity
            ? `${Math.round(((stop?.loadAfter ?? 0) / active.vehicle.capacity) * 100)}% / ${fmt(active.vehicle.capacity)} kg`
            : "0 kg"}
        </small>
      </div>
    </div>
  );
}
type Language = "en" | "hr";
const enTranslations = {
  workspace: "WORKSPACE",
  overview: "Overview",
  orders: "Transport orders",
  fleet: "Fleet",
  route: "Route optimization",
  validation: "Validation",
  operations: "OPERATIONS CENTER",
  goodMorning: "Good morning.",
  fleetOverview: "Fleet overview",
  businessValidation: "Business validation",
  overviewCopy: "Overview of logistics operations and fleet performance.",
  generalCopy: "Manage orders, vehicles and route optimization.",
  run: "Run optimization",
  optimizing: "Optimizing...",
  workspaceLabel: "Operations HQ",
  demo: "Demo workspace",
  operational: "System operational",
  language: "Language",
  administrator: "Administrator",
  transportOrders: "Transport orders",
  availableVehicles: "Available vehicles",
  totalDistance: "Total distance",
  completedOrders: "Completed orders",
  activeRequests: "Active requests",
  fleetReady: "Fleet capacity ready",
  roundTrip: "Optimized round trip",
  calculate: "Run optimization to calculate",
  constraints: "All constraints satisfied",
  awaiting: "Awaiting optimization",
  fleetPerformance: "Fleet performance",
  liveCapacity: "Live vehicle capacity and operating status",
  viewFleet: "View fleet",
  recentOrders: "Recent transport orders",
  incoming: "Incoming jobs overview",
  engine: "Optimization engine",
  engineCopy: "Pickup & delivery route planning",
  ready: "READY",
  heavyDuty: "Heavy duty vehicle",
  assigned: "ASSIGNED",
  available: "AVAILABLE",
  maxPayload: "MAKS. TERET",
  maxMachines: "MAKS. STROJEVA",
  units: "jedinica",
  peakPayload: "Najveće iskorištenje tereta",
  routeSuffix: "km ruta",
  noRoute: "Ruta nije generirana",
  allOrders: "Svi transportni nalozi",
  ordersCopy: "10 poslova · težina stroja i lokacije preuzimanja / isporuke",
  ordersCount: "NALOGA",
  order: "NALOG",
  machine: "STROJ",
  weight: "TEŽINA",
  pickupLocation: "PREUZIMANJE",
  deliveryLocation: "ISPORUKA",
  status: "STATUS",
  readyRoutes: "Ready to optimize your routes?",
  readyRoutesCopy:
    "Pokrenite optimizaciju kako biste izračunali raspodjelu naloga, redoslijed posjeta i ukupnu kilometražu.",
  startOptimization: "Start optimization",
  optimizationCompleted: "Optimization completed",
  optimizationAttention: "Optimization requires attention",
  combinedDistance: "ukupna udaljenost",
  bothVehicles: "Oba vozila",
  ordersAssigned: "Dodijeljeni nalozi",
  pickupDelivery: "Preuzimanje + isporuka",
  fleetWorkTime: "Radno vrijeme voznog parka",
  drivingService: "Vožnja + usluge",
  routeVisualization: "Prikaz rute",
  routeMapCopy: "Karta ruta prema koordinatama · Euklidska udaljenost",
  simulatedMap: "SIMULIRANA KARTA",
  truckA: "Kamion A",
  truckB: "Kamion B",
  depot: "Baza",
  vehicleRoutes: "Rute vozila",
  stopByStop: "Izvršavanje po pojedinim stanicama",
  distance: "UDALJENOST",
  workTime: "RADNO VRIJEME",
  ordersLabel: "NALOGI",
  base: "Baza",
  departure: "Polazak",
  returnDepot: "Povratak u bazu",
  loadAfter: "Teret nakon",
  items: "stavki",
  constraintValidation: "Provjera ograničenja",
  constraintCopy: "Poslovna pravila provjerena prema generiranom planu",
  allChecksPassed: "SVE PROVJERE PROŠLE",
  reviewRequired: "POTREBNA PROVJERA",
  notRun: "NIJE POKRENUTO",
  checkAssigned: "Svaki nalog dodijeljen je točno jednom vozilu",
  checkPickup: "Preuzimanje se odvija prije isporuke",
  checkVehicle: "Preuzimanje i isporuku obavlja isto vozilo",
  checkPayload: "Teret nikada ne prelazi kapacitet vozila",
  checkMachines: "Poštovan maksimalni istodobni broj strojeva",
  checkBase: "Oba vozila kreću iz i vraćaju se u L0",
  checkWorkTime: "Ukupno radno vrijeme ≤ 9 sati uključujući usluge",
  checkAssignedOnce: "Svaki nalog dodijeljen je točno jednom vozilu",
  checkPickupVehicle: "Preuzimanje prije isporuke / isto vozilo",
  checkLimits: "Granice tereta i istodobnih strojeva",
  checkBaseTime: "Povratak u bazu i radno vrijeme od 9 sati",
  pass: "PROŠLO",
  pending: "ČEKANJE",
  runValidation: "Pokreni provjeru optimizacijom",
  liveNavigation: "LIVE NAVIGATION",
  currentWeight: "CURRENT WEIGHT",
  clearRoute: "Clear route",
  eta: "ETA",
  nextManeuver: "NEXT MANEUVER",
  then: "THEN",
  pickup: "Pickup",
  deliver: "Deliver",
  returnBase: "Return to depot · L0",
  routeComplete: "Route complete",
  headToward: "Head toward",
  pickUpAction: "PICK UP",
  deliverAction: "DELIVER",
  start: "START",
  atBase: "At base",
  navigating: "NAVIGATING",
  arrived: "ARRIVED",
  routeProgress: "ROUTE PROGRESS",
  restart: "Restart",
  pause: "Pause",
  startNavigation: "Start navigation",
  speed: "Change playback speed",
  interactiveMap: "Live transport route interactive map",
  atLocation: "at",
  truck: "Truck",
  smartPlanner: "SMART LOGISTICS PLANNER",
  allSystemsNormal: "All systems normal",
  totalKm: "TOTAL KM",
  awaitingRun: "AWAITING RUN",
  engineReady: "Engine ready",
};
const hrTranslations = {
  ...enTranslations,
  workspace: "RADNI PROSTOR",
  overview: "Pregled",
  orders: "Transportni nalozi",
  fleet: "Vožni park",
  route: "Optimizacija ruta",
  validation: "Provjera",
  operations: "OPERACIJSKI CENTAR",
  goodMorning: "Dobro jutro.",
  fleetOverview: "Pregled voznog parka",
  businessValidation: "Poslovna provjera",
  overviewCopy: "Pregled logističkih operacija i uspješnosti voznog parka.",
  generalCopy: "Upravljajte nalozima, vozilima i optimizacijom ruta.",
  run: "Pokreni optimizaciju",
  optimizing: "Optimiziram...",
  workspaceLabel: "Operativno sjedište",
  demo: "Demo radni prostor",
  operational: "Sustav je aktivan",
  language: "Jezik",
  administrator: "Administrator",
  transportOrders: "Transportni nalozi",
  availableVehicles: "Raspoloživa vozila",
  totalDistance: "Ukupna udaljenost",
  completedOrders: "Dovršeni nalozi",
  activeRequests: "Aktivni zahtjevi",
  fleetReady: "Kapacitet voznog parka spreman",
  roundTrip: "Optimizirani povratni smjer",
  calculate: "Pokrenite optimizaciju za izračun",
  constraints: "Sva ograničenja zadovoljena",
  awaiting: "Čeka optimizaciju",
  fleetPerformance: "Učinkovitost voznog parka",
  liveCapacity: "Kapacitet i status vozila uživo",
  viewFleet: "Prikaži vozni park",
  recentOrders: "Nedavni transportni nalozi",
  incoming: "Pregled novih poslova",
  engine: "Motor za optimizaciju",
  engineCopy: "Planiranje ruta preuzimanja i isporuke",
  ready: "SPREMNO",
  heavyDuty: "Teško vozilo",
  assigned: "DODIJELJENO",
  available: "RASPOLOŽIVO",
  allOrders: "Svi transportni nalozi",
  readyRoutes: "Spremni optimizirati rute?",
  startOptimization: "Pokreni optimizaciju",
  optimizationCompleted: "Optimizacija je dovršena",
  optimizationAttention: "Optimizacija zahtijeva provjeru",
  ordersAssigned: "Dodijeljeni nalozi",
  fleetWorkTime: "Radno vrijeme voznog parka",
  routeVisualization: "Prikaz rute",
  vehicleRoutes: "Rute vozila",
  liveNavigation: "NAVIGACIJA uživo",
  clearRoute: "Čista ruta",
  nextManeuver: "SLJEDEĆI MANEVAR",
  then: "ZATIM",
  pickup: "Preuzmi",
  deliver: "Isporuči",
  returnBase: "Povratak u bazu · L0",
  routeComplete: "Ruta je dovršena",
  headToward: "Krenite prema",
  pickUpAction: "PREUZIMANJE",
  deliverAction: "ISPORUKA",
  start: "POČETAK",
  atBase: "U bazi",
  navigating: "NAVIGACIJA",
  arrived: "STIGLI",
  routeProgress: "NAPREDAK RUTE",
  restart: "Pokreni ponovno",
  pause: "Pauziraj",
  startNavigation: "Pokreni navigaciju",
  speed: "Promijeni brzinu reprodukcije",
  interactiveMap: "Interaktivna karta transportne rute uživo",
  atLocation: "u",
  truck: "Kamion",
  smartPlanner: "PAMETNI PLANER LOGISTIKE",
  allSystemsNormal: "Svi sustavi rade normalno",
  currentWeight: "TRENUTNA TEŽINA",
};
const translations = {
  en: enTranslations,
  hr: hrTranslations,
};
export default App;
