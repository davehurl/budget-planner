import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SALARY_ANNUAL = 85000;
const TAKE_HOME_MONTHLY = 4988;
const SAVINGS_MONTHLY_TARGET = 500;
const SAVINGS_YEAR_GOAL = 6000;

const BUDGET_CATEGORIES = [
  { name: "Housing", color: "#c8a96e", items: [{ name: "Rent", amount: 1400 }, { name: "Council Tax", amount: 120 }] },
  { name: "Utilities", color: "#7eb8a4", items: [{ name: "Electricity", amount: 40 }, { name: "Gas", amount: 40 }, { name: "Water", amount: 40 }, { name: "Broadband", amount: 25 }, { name: "Phone Plan", amount: 10 }] },
  { name: "Transport", color: "#8fa8c8", items: [{ name: "TfL Card", amount: 256 }] },
  { name: "Health & Fitness", color: "#b8a0c8", items: [{ name: "Therapy", amount: 280, note: "\u00a370/week" }, { name: "Gymbox", amount: 120 }, { name: "ClassPass", amount: 60 }, { name: "Work Credit", amount: -50 }] },
  { name: "Subscriptions", color: "#c8807e", items: [{ name: "Apple", amount: 9.99 }, { name: "Spotify", amount: 9.99 }, { name: "Claude", amount: 20 }, { name: "FT", amount: 0, note: "TBC \u2014 work may cover" }] },
  { name: "Food & Drink", color: "#a0b878", items: [{ name: "Groceries", amount: 450, note: "Cook at home" }, { name: "Takeaway Coffee", amount: 69, note: "\u00a34 x 4 days/week" }] },
];

const ACCOUNTS = [
  {
    country: "United Kingdom",
    flag: "\uD83C\uDDEC\uD83C\uDDE7",
    color: "#c8a96e",
    accounts: [
      { bank: "Barclays", name: "Current Account", purpose: "Primary UK account", status: "active" },
      { bank: "Barclays", name: "Savings Account", purpose: "UK savings", status: "active" },
    ],
  },
  {
    country: "Ireland",
    flag: "\uD83C\uDDEE\uD83C\uDDEA",
    color: "#7eb8a4",
    accounts: [
      { bank: "Monzo", name: "Current Account", purpose: "Primary Irish account", status: "active" },
      { bank: "Revolut", name: "Current Account", purpose: "Utility account — transfers & currency", status: "active" },
      { bank: "Revolut", name: "Savings Account", purpose: "Irish basic savings", status: "active" },
    ],
  },
  {
    country: "United States",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    color: "#8fa8c8",
    accounts: [
      { bank: "TD Bank", name: "Checking Account", purpose: "Original US account — address update needed", status: "active", note: true },
    ],
  },
  {
    country: "Utility",
    flag: "\uD83C\uDF10",
    color: "#b8a0c8",
    accounts: [
      { bank: "Wise", name: "Multi-currency Account", purpose: "International transfers & currency exchange", status: "active" },
    ],
  },
];

const totalBudget = BUDGET_CATEGORIES.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + i.amount, 0), 0);
const pieData = BUDGET_CATEGORIES.map((cat) => ({ name: cat.name, value: Math.max(cat.items.reduce((s, i) => s + i.amount, 0), 0), color: cat.color }));
const fmt = (n) => n < 0 ? "-\u00a3" + Math.abs(n).toFixed(2).replace(/\.00$/, "") : "\u00a3" + n.toFixed(2).replace(/\.00$/, "");

const TABS = ["home", "overview", "breakdown", "savings", "tracker"];
const TAB_LABELS = { home: "Accounts", overview: "Overview", breakdown: "Breakdown", savings: "Savings", tracker: "Tracker" };

export default function BudgetPlanner() {
  const [activeTab, setActiveTab] = useState("home");
  const [transactions, setTransactions] = useState([]);
  const [savingsLog, setSavingsLog] = useState([]);
  const [form, setForm] = useState({ name: "", amount: "", category: BUDGET_CATEGORIES[0].name, date: new Date().toISOString().split("T")[0] });
  const [savingsForm, setSavingsForm] = useState({ amount: "", month: new Date().toISOString().slice(0, 7) });
  const [expandedCat, setExpandedCat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("budget_transactions");
        if (r) setTransactions(JSON.parse(r.value));
        const s = await window.storage.get("savings_log");
        if (s) setSavingsLog(JSON.parse(s.value));
      } catch (e) {}
    })();
  }, []);

  const saveTx = async (list) => { setTransactions(list); try { await window.storage.set("budget_transactions", JSON.stringify(list)); } catch (e) {} };
  const saveSavings = async (list) => { setSavingsLog(list); try { await window.storage.set("savings_log", JSON.stringify(list)); } catch (e) {} };

  const addTransaction = () => {
    if (!form.name || !form.amount) return;
    saveTx([{ ...form, amount: parseFloat(form.amount), id: Date.now() }, ...transactions]);
    setForm({ name: "", amount: "", category: BUDGET_CATEGORIES[0].name, date: new Date().toISOString().split("T")[0] });
  };

  const addSavings = () => {
    if (!savingsForm.amount) return;
    saveSavings([{ ...savingsForm, amount: parseFloat(savingsForm.amount), id: Date.now() }, ...savingsLog]);
    setSavingsForm({ amount: "", month: new Date().toISOString().slice(0, 7) });
  };

  const spentByCategory = BUDGET_CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = transactions.filter((t) => t.category === cat.name).reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {});

  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const leftOver = TAKE_HOME_MONTHLY - totalBudget;
  const totalSaved = savingsLog.reduce((s, e) => s + e.amount, 0);
  const savingsPct = Math.min((totalSaved / SAVINGS_YEAR_GOAL) * 100, 100);
  const monthsElapsed = new Date().getMonth() + 1;
  const expectedSaved = monthsElapsed * SAVINGS_MONTHLY_TARGET;

  return (
    <div style={{ fontFamily: "Georgia, Times New Roman, serif", background: "#0f0f0f", minHeight: "100dvh", color: "#e8e2d9", width: "100%", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #2a2a2a", padding: isMobile ? "20px 16px 0" : "28px 40px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", margin: "0 0 4px" }}>2026 Budget</p>
            <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 400, margin: 0, color: "#e8e2d9", letterSpacing: "-0.02em" }}>Financial Planner</h1>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginTop: 18, overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: isMobile ? 1 : "none", background: "none", border: "none", cursor: "pointer",
              padding: isMobile ? "10px 4px" : "10px 20px", fontSize: isMobile ? 10 : 12,
              letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
              color: activeTab === tab ? "#c8a96e" : "#555",
              borderBottom: activeTab === tab ? "1px solid #c8a96e" : "1px solid transparent",
              marginBottom: -1,
            }}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? "20px 16px 32px" : "28px 40px 40px", flex: 1, overflowY: "auto" }}>

        {/* HOME / ACCOUNTS TAB */}
        {activeTab === "home" && (
          <div>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 20px", lineHeight: 1.6 }}>
              Your account directory — a map of where your money lives.
            </p>
            {ACCOUNTS.map((region) => (
              <div key={region.country} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{region.flag}</span>
                  <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: region.color }}>{region.country}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {region.accounts.map((acc, i) => (
                    <div key={i} style={{
                      background: "#181818", border: "1px solid #2a2a2a",
                      borderLeft: "3px solid " + (acc.status === "upcoming" ? "#333" : region.color),
                      borderRadius: 2, padding: "14px 16px",
                      opacity: acc.status === "upcoming" ? 0.6 : 1,
                    }}>
                      <div style={{ width: "100%" }}>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontSize: 13, color: "#e8e2d9", margin: "0 0 3px" }}>{acc.bank}</p>
                          <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px" }}>{acc.name}</p>
                          <p style={{ fontSize: 11, color: "#666", margin: 0, lineHeight: 1.5 }}>{acc.purpose}</p>
                        </div>
                        {acc.status === "upcoming" && (
                          <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", background: "#222", padding: "3px 8px", borderRadius: 2, whiteSpace: "nowrap", marginLeft: 8 }}>Soon</span>
                        )}
                        {acc.note && (
                          <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8807e", background: "#1a1212", padding: "3px 8px", borderRadius: 2, whiteSpace: "nowrap", marginLeft: 8 }}>Action needed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 8 }}>
              <p style={{ fontSize: 10, color: "#444", textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Credit card — coming later</p>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Monthly Take-Home", value: fmt(TAKE_HOME_MONTHLY), sub: "after tax & NI" },
                { label: "Total Budgeted", value: fmt(totalBudget), sub: "per month" },
                { label: "Remaining", value: fmt(leftOver), sub: "per month", highlight: true },
              ].map((card, i) => (
                <div key={card.label} style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "14px 12px" : "22px", borderRadius: 2, borderTop: card.highlight ? "2px solid #c8a96e" : "2px solid #2a2a2a", gridColumn: isMobile && i === 2 ? "1 / -1" : "auto" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", margin: "0 0 8px" }}>{card.label}</p>
                  <p style={{ fontSize: isMobile ? 22 : 28, fontWeight: 400, margin: "0 0 3px", color: card.highlight ? "#c8a96e" : "#e8e2d9" }}>{card.value}</p>
                  <p style={{ fontSize: 10, color: "#555", margin: 0 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "22px", borderRadius: 2 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 14px" }}>Spend Distribution</p>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 2, fontSize: 11 }} formatter={(v) => [fmt(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 6 }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontSize: 10, color: "#888" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "22px", borderRadius: 2 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 14px" }}>By Category</p>
                {BUDGET_CATEGORIES.map((cat) => {
                  const total = cat.items.reduce((s, i) => s + i.amount, 0);
                  const pct = ((Math.max(total, 0) / TAKE_HOME_MONTHLY) * 100).toFixed(0);
                  return (
                    <div key={cat.name} style={{ marginBottom: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "#ccc" }}>{cat.name}</span>
                        <span style={{ fontSize: 12, color: "#e8e2d9" }}>{fmt(total)}</span>
                      </div>
                      <div style={{ height: 3, background: "#2a2a2a", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: pct + "%", background: cat.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "22px", borderRadius: 2 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 14px" }}>Annual Perspective</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {[
                  { label: "Coffee (4x/week)", note: "\u00a3828/yr" },
                  { label: "Therapy", note: "\u00a33,360/yr" },
                  { label: "Fitness", note: "\u00a31,560/yr" },
                  { label: "Surplus", note: "\u00a3" + (leftOver * 12).toLocaleString() + "/yr", gold: true },
                ].map((item) => (
                  <div key={item.label} style={{ borderLeft: "2px solid " + (item.gold ? "#c8a96e" : "#2a2a2a"), paddingLeft: 12 }}>
                    <p style={{ fontSize: 10, color: "#666", margin: "0 0 3px" }}>{item.label}</p>
                    <p style={{ fontSize: isMobile ? 15 : 18, color: item.gold ? "#c8a96e" : "#e8e2d9", margin: 0 }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BREAKDOWN TAB */}
        {activeTab === "breakdown" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BUDGET_CATEGORIES.map((cat) => {
              const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
              const isOpen = expandedCat === cat.name;
              return (
                <div key={cat.name} style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, overflow: "hidden" }}>
                  <button onClick={() => setExpandedCat(isOpen ? null : cat.name)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                      <span style={{ fontSize: 14, color: "#e8e2d9" }}>{cat.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 15, color: "#e8e2d9" }}>{fmt(catTotal)}</span>
                      <span style={{ color: "#555", fontSize: 18 }}>{isOpen ? "-" : "+"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #222", padding: "4px 0 10px" }}>
                      {cat.items.map((item) => (
                        <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px 9px 34px" }}>
                          <div>
                            <span style={{ fontSize: 13, color: "#bbb" }}>{item.name}</span>
                            {item.note && <span style={{ fontSize: 10, color: "#666", marginLeft: 8 }}>{item.note}</span>}
                          </div>
                          <span style={{ fontSize: 13, color: item.amount < 0 ? "#7eb8a4" : "#e8e2d9" }}>{item.amount === 0 ? "TBC" : fmt(item.amount)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 16px 4px 34px", borderTop: "1px solid #222", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>Monthly total</span>
                        <span style={{ fontSize: 13, color: cat.color }}>{fmt(catTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ background: "#181818", border: "1px solid #c8a96e", borderRadius: 2, padding: "16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: "#c8a96e" }}>Total Budgeted</span>
              <span style={{ fontSize: 20, color: "#c8a96e" }}>{fmt(totalBudget)}</span>
            </div>
          </div>
        )}

        {/* SAVINGS TAB */}
        {activeTab === "savings" && (
          <div>
            {/* Year goal progress */}
            <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: isMobile ? "16px" : "22px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 6px" }}>Year Goal</p>
                  <p style={{ fontSize: 28, color: "#c8a96e", margin: 0 }}>{fmt(SAVINGS_YEAR_GOAL)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 6px" }}>Saved So Far</p>
                  <p style={{ fontSize: 28, color: "#e8e2d9", margin: 0 }}>{fmt(totalSaved)}</p>
                </div>
              </div>
              <div style={{ height: 6, background: "#2a2a2a", borderRadius: 3, marginBottom: 8 }}>
                <div style={{ height: "100%", width: savingsPct + "%", background: "#c8a96e", borderRadius: 3, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#666" }}>{savingsPct.toFixed(0)}% of goal</span>
                <span style={{ fontSize: 11, color: totalSaved >= expectedSaved ? "#7eb8a4" : "#c87e7e" }}>
                  {totalSaved >= expectedSaved ? "On track" : fmt(expectedSaved - totalSaved) + " behind pace"}
                </span>
              </div>
            </div>

            {/* Monthly target cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Monthly Target", value: fmt(SAVINGS_MONTHLY_TARGET), sub: "Barclays Savings" },
                { label: "Remaining This Month", value: fmt(Math.max(SAVINGS_MONTHLY_TARGET - (savingsLog.filter(e => e.month === new Date().toISOString().slice(0, 7)).reduce((s, e) => s + e.amount, 0)), 0)), sub: "to hit target" },
              ].map((card) => (
                <div key={card.label} style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "14px 12px" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", margin: "0 0 6px" }}>{card.label}</p>
                  <p style={{ fontSize: 20, color: "#e8e2d9", margin: "0 0 3px" }}>{card.value}</p>
                  <p style={{ fontSize: 10, color: "#555", margin: 0 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Log savings */}
            <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "16px", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 12px" }}>Log a Savings Transfer</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    value={savingsForm.amount}
                    onChange={(e) => setSavingsForm({ ...savingsForm, amount: e.target.value })}
                    type="number" placeholder="Amount (£)"
                    style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                  />
                  <input
                    value={savingsForm.month}
                    onChange={(e) => setSavingsForm({ ...savingsForm, month: e.target.value })}
                    type="month"
                    style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <button onClick={addSavings} style={{ width: "100%", background: "#c8a96e", border: "none", borderRadius: 2, padding: "13px", color: "#0f0f0f", fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif" }}>
                  Log Transfer
                </button>
              </div>
            </div>

            {/* Savings history */}
            {savingsLog.length > 0 && (
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #222" }}>
                  <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>Transfer History</span>
                </div>
                {savingsLog.map((entry) => (
                  <div key={entry.id} style={{ padding: "13px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 13, color: "#ccc", margin: "0 0 2px" }}>Barclays Savings</p>
                      <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{entry.month}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 15, color: "#7eb8a4" }}>{fmt(entry.amount)}</span>
                      <button onClick={() => saveSavings(savingsLog.filter((e) => e.id !== entry.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 18, padding: 0 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRACKER TAB */}
        {activeTab === "tracker" && (
          <div>
            <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "16px", marginBottom: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 12px" }}>Log a Transaction</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Description (e.g. Tesco weekly shop)" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" placeholder="Amount (£)" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }} />
                  <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}>
                  {BUDGET_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <button onClick={addTransaction} style={{ width: "100%", background: "#c8a96e", border: "none", borderRadius: 2, padding: "13px", color: "#0f0f0f", fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif" }}>Add Transaction</button>
              </div>
            </div>

            {transactions.length > 0 && (
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "16px", marginBottom: 14 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 12px" }}>Spent vs Budgeted</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Spent", value: fmt(totalSpent), color: "#e8e2d9" },
                    { label: "Budgeted", value: fmt(totalBudget), color: "#888" },
                    { label: "Left", value: fmt(totalBudget - totalSpent), color: totalBudget - totalSpent >= 0 ? "#7eb8a4" : "#c87e7e" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 9, color: "#666", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
                      <p style={{ fontSize: 17, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {BUDGET_CATEGORIES.map((cat) => {
                  const budget = cat.items.reduce((s, i) => s + i.amount, 0);
                  const spent = spentByCategory[cat.name] || 0;
                  if (spent === 0) return null;
                  const pct = Math.min((spent / Math.max(budget, 1)) * 100, 100);
                  const over = spent > budget;
                  return (
                    <div key={cat.name} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "#aaa" }}>{cat.name}</span>
                        <span style={{ fontSize: 12, color: over ? "#c87e7e" : "#aaa" }}>{fmt(spent)} / {fmt(budget)}</span>
                      </div>
                      <div style={{ height: 4, background: "#222", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: pct + "%", background: over ? "#c87e7e" : cat.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#444" }}>
                <p style={{ fontSize: 14 }}>No transactions logged yet.</p>
              </div>
            ) : (
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2 }}>
                {transactions.map((t) => {
                  const cat = BUDGET_CATEGORIES.find((c) => c.name === t.category);
                  const dotColor = cat ? cat.color : "#555";
                  return (
                    <div key={t.id} style={{ padding: "13px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#ccc", marginBottom: 3 }}>{t.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
                          <span style={{ fontSize: 11, color: "#666" }}>{t.category} · {t.date}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 15, color: "#e8e2d9" }}>{fmt(t.amount)}</span>
                        <button onClick={() => saveTx(transactions.filter((tx) => tx.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 18, padding: 0 }}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
