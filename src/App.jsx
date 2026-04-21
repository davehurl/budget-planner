import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SALARY_ANNUAL = 85000;
const TAKE_HOME_MONTHLY = 4988;

const BUDGET_CATEGORIES = [
  {
    name: "Housing",
    color: "#c8a96e",
    items: [
      { name: "Rent", amount: 1400 },
      { name: "Council Tax", amount: 120 },
    ],
  },
  {
    name: "Utilities",
    color: "#7eb8a4",
    items: [
      { name: "Electricity", amount: 40 },
      { name: "Gas", amount: 40 },
      { name: "Water", amount: 40 },
      { name: "Broadband", amount: 25 },
      { name: "Phone Plan", amount: 10 },
    ],
  },
  {
    name: "Transport",
    color: "#8fa8c8",
    items: [{ name: "TfL Card", amount: 256 }],
  },
  {
    name: "Health & Fitness",
    color: "#b8a0c8",
    items: [
      { name: "Therapy", amount: 280, note: "£70/week" },
      { name: "Gymbox", amount: 120 },
      { name: "ClassPass", amount: 60 },
      { name: "Work Credit", amount: -50 },
    ],
  },
  {
    name: "Subscriptions",
    color: "#c8807e",
    items: [
      { name: "Apple", amount: 9.99 },
      { name: "Spotify", amount: 9.99 },
      { name: "Claude", amount: 20 },
      { name: "FT", amount: 0, note: "TBC — work may cover" },
    ],
  },
  {
    name: "Food & Drink",
    color: "#a0b878",
    items: [
      { name: "Groceries", amount: 450, note: "Cook at home" },
      { name: "Takeaway Coffee", amount: 69, note: "£4 x 4 days/week" },
    ],
  },
];

const totalBudget = BUDGET_CATEGORIES.reduce(
  (sum, cat) => sum + cat.items.reduce((s, i) => s + i.amount, 0),
  0
);

const pieData = BUDGET_CATEGORIES.map((cat) => ({
  name: cat.name,
  value: Math.max(cat.items.reduce((s, i) => s + i.amount, 0), 0),
  color: cat.color,
}));

const fmt = (n) =>
  n < 0
    ? "-\u00a3" + Math.abs(n).toFixed(2).replace(/\.00$/, "")
    : "\u00a3" + n.toFixed(2).replace(/\.00$/, "");

export default function BudgetPlanner() {
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: BUDGET_CATEGORIES[0].name,
    date: new Date().toISOString().split("T")[0],
  });
  const [expandedCat, setExpandedCat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("budget_transactions");
        if (r) setTransactions(JSON.parse(r.value));
      } catch (e) {}
    })();
  }, []);

  const saveTransactions = async (list) => {
    setTransactions(list);
    try {
      await window.storage.set("budget_transactions", JSON.stringify(list));
    } catch (e) {}
  };

  const addTransaction = () => {
    if (!form.name || !form.amount) return;
    const t = { ...form, amount: parseFloat(form.amount), id: Date.now() };
    saveTransactions([t, ...transactions]);
    setForm({
      name: "",
      amount: "",
      category: BUDGET_CATEGORIES[0].name,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const deleteTransaction = (id) =>
    saveTransactions(transactions.filter((t) => t.id !== id));

  const spentByCategory = BUDGET_CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = transactions
      .filter((t) => t.category === cat.name)
      .reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {});

  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const leftOver = TAKE_HOME_MONTHLY - totalBudget;

  const p = isMobile ? "16px" : "40px";

  return (
    <div style={{ fontFamily: "Georgia, Times New Roman, serif", background: "#0f0f0f", minHeight: "100vh", minHeight: "100dvh", color: "#e8e2d9", width: "100%" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #2a2a2a", padding: isMobile ? "24px 16px 0" : "32px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", margin: "0 0 4px" }}>London Budget</p>
            <h1 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 400, margin: 0, color: "#e8e2d9", letterSpacing: "-0.02em" }}>Financial Planner</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#888", textTransform: "uppercase", margin: "0 0 4px" }}>Annual Salary</p>
            <p style={{ fontSize: isMobile ? 22 : 28, fontWeight: 400, margin: 0, color: "#c8a96e" }}>{"\u00a3"}{SALARY_ANNUAL.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginTop: 20 }}>
          {["overview", "breakdown", "tracker"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: isMobile ? 1 : "none",
                background: "none", border: "none", cursor: "pointer",
                padding: isMobile ? "10px 0" : "10px 24px",
                fontSize: isMobile ? 11 : 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: activeTab === tab ? "#c8a96e" : "#666",
                borderBottom: activeTab === tab ? "1px solid #c8a96e" : "1px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: isMobile ? "20px 16px" : "32px 40px" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            {/* Key numbers */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Monthly Take-Home", value: fmt(TAKE_HOME_MONTHLY), sub: "after tax & NI" },
                { label: "Total Budgeted", value: fmt(totalBudget), sub: "per month" },
                { label: "Remaining", value: fmt(leftOver), sub: "per month", highlight: true },
              ].map((card, i) => (
                <div key={card.label} style={{
                  background: "#181818", border: "1px solid #2a2a2a",
                  padding: isMobile ? "16px 12px" : "24px", borderRadius: 2,
                  borderTop: card.highlight ? "2px solid #c8a96e" : "2px solid #2a2a2a",
                  gridColumn: isMobile && i === 2 ? "1 / -1" : "auto",
                }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", margin: "0 0 8px" }}>{card.label}</p>
                  <p style={{ fontSize: isMobile ? 24 : 32, fontWeight: 400, margin: "0 0 4px", color: card.highlight ? "#c8a96e" : "#e8e2d9" }}>{card.value}</p>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "24px", borderRadius: 2 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 16px" }}>Spend Distribution</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 2, fontSize: 12 }}
                      formatter={(v) => [fmt(v), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontSize: 10, color: "#888" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "24px", borderRadius: 2 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 16px" }}>By Category</p>
                {BUDGET_CATEGORIES.map((cat) => {
                  const total = cat.items.reduce((s, i) => s + i.amount, 0);
                  const pct = ((Math.max(total, 0) / TAKE_HOME_MONTHLY) * 100).toFixed(0);
                  return (
                    <div key={cat.name} style={{ marginBottom: 12 }}>
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

            {/* Annual */}
            <div style={{ background: "#181818", border: "1px solid #2a2a2a", padding: isMobile ? "16px" : "24px", borderRadius: 2 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 16px" }}>Annual Perspective</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {[
                  { label: "Coffee (4x/week)", note: "\u00a3828/yr" },
                  { label: "Therapy", note: "\u00a33,360/yr" },
                  { label: "Fitness", note: "\u00a31,560/yr" },
                  { label: "Surplus", note: "\u00a3" + (leftOver * 12).toLocaleString() + "/yr", gold: true },
                ].map((item) => (
                  <div key={item.label} style={{ borderLeft: "2px solid " + (item.gold ? "#c8a96e" : "#2a2a2a"), paddingLeft: 12 }}>
                    <p style={{ fontSize: 10, color: "#666", margin: "0 0 4px" }}>{item.label}</p>
                    <p style={{ fontSize: isMobile ? 16 : 20, color: item.gold ? "#c8a96e" : "#e8e2d9", margin: 0 }}>{item.note}</p>
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
                  <button
                    onClick={() => setExpandedCat(isOpen ? null : cat.name)}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: cat.color }} />
                      <span style={{ fontSize: 14, color: "#e8e2d9" }}>{cat.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 16, color: "#e8e2d9" }}>{fmt(catTotal)}</span>
                      <span style={{ color: "#555", fontSize: 18 }}>{isOpen ? "-" : "+"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #222", padding: "4px 0 10px" }}>
                      {cat.items.map((item) => (
                        <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px 10px 36px" }}>
                          <div>
                            <span style={{ fontSize: 13, color: "#bbb" }}>{item.name}</span>
                            {item.note && (
                              <span style={{ fontSize: 10, color: "#666", marginLeft: 8 }}>{item.note}</span>
                            )}
                          </div>
                          <span style={{ fontSize: 13, color: item.amount < 0 ? "#7eb8a4" : "#e8e2d9" }}>
                            {item.amount === 0 ? "TBC" : fmt(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px 4px 36px", borderTop: "1px solid #222", marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>Monthly total</span>
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

        {/* TRACKER TAB */}
        {activeTab === "tracker" && (
          <div>
            <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "16px", marginBottom: 16 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 14px" }}>Log a Transaction</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Description (e.g. Tesco weekly shop)"
                  style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    type="number"
                    placeholder="Amount (£)"
                    style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                  />
                  <input
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    type="date"
                    style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 2, padding: "12px", color: "#e8e2d9", fontSize: 14, boxSizing: "border-box" }}
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={addTransaction}
                  style={{ width: "100%", background: "#c8a96e", border: "none", borderRadius: 2, padding: "14px", color: "#0f0f0f", fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: "0.05em" }}
                >
                  Add Transaction
                </button>
              </div>
            </div>

            {transactions.length > 0 && (
              <div style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 2, padding: "16px", marginBottom: 16 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 14px" }}>Spent vs Budgeted</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Spent", value: fmt(totalSpent), color: "#e8e2d9" },
                    { label: "Budgeted", value: fmt(totalBudget), color: "#888" },
                    { label: "Remaining", value: fmt(totalBudget - totalSpent), color: totalBudget - totalSpent >= 0 ? "#7eb8a4" : "#c87e7e" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: "#666", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
                      <p style={{ fontSize: 18, color: s.color, margin: 0 }}>{s.value}</p>
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
                    <div key={t.id} style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#ccc", marginBottom: 3 }}>{t.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
                          <span style={{ fontSize: 11, color: "#666" }}>{t.category} · {t.date}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 15, color: "#e8e2d9" }}>{fmt(t.amount)}</span>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 18, padding: 0, lineHeight: 1 }}
                        >
                          ×
                        </button>
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
