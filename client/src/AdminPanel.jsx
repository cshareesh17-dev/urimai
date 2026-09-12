import { useState, useEffect } from "react";
import { api } from "./api";

const RED = "#c0392b";

const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)", color: "#eee", fontFamily: "'DM Sans', sans-serif", padding: "0" },
  topBar: { background: "#111", borderBottom: "2px solid #333", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: "20px", fontWeight: "900", color: RED, letterSpacing: "-0.5px" },
  logoSpan: { color: "#eee", fontWeight: "400", fontSize: "13px", marginLeft: "10px" },
  nav: { display: "flex", gap: "4px", flexWrap: "wrap" },
  navBtn: (active) => ({ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700", background: active ? RED : "#222", color: active ? "#fff" : "#aaa", transition: "all 0.2s" }),
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", padding: "24px" },
  card: { background: "#1e1e1e", borderRadius: "14px", padding: "20px", border: "1px solid #333" },
  statNum: { fontSize: "32px", fontWeight: "900", color: "#fff" },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: { textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #333", color: "#888", fontWeight: "700", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "12px 16px", borderBottom: "1px solid #222", color: "#ccc" },
  badge: (color) => ({ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: color + "22", color: color, border: `1px solid ${color}44` }),
  btn: (color = RED) => ({ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", background: color, color: "#fff" }),
  input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #333", background: "#111", color: "#eee", fontSize: "14px", width: "100%", outline: "none" },
  section: { padding: "24px" },
  sectionTitle: { fontSize: "18px", fontWeight: "800", marginBottom: "16px", color: "#fff" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#666" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
  replyBox: { background: "#111", borderRadius: "8px", padding: "12px", marginTop: "8px", borderLeft: `3px solid ${RED}` },
};

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.adminLogin(username, password);
      localStorage.setItem("urimai_admin_token", res.token);
      onLogin(res.admin);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <div style={{ width: "380px", background: "#1e1e1e", borderRadius: "16px", padding: "40px 32px", border: "1px solid #333" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: "900", color: RED }}>URIMAI</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>Admin Panel</div>
        </div>
        {error && <div style={{ background: "#c0392b22", color: RED, padding: "10px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px", textAlign: "center" }}>{error}</div>}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>USERNAME</div>
          <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>PASSWORD</div>
          <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button style={{ ...S.btn(RED), width: "100%", padding: "12px", fontSize: "14px" }} onClick={handle} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#555" }}>
          Default: admin / admin123
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.adminDashboard().then(setData).catch(console.error); }, []);
  if (!data) return <div style={S.emptyState}>Loading dashboard...</div>;

  const cards = [
    { label: "Total Users", num: data.totalUsers, color: "#1a4e8b" },
    { label: "Total Profiles", num: data.totalProfiles, color: "#7b2d8b" },
    { label: "Pending Queries", num: data.pendingQueries, color: "#b85c00" },
    { label: "Resolved Queries", num: data.resolvedQueries, color: "#1a6b3c" },
    { label: "Total Queries", num: data.totalQueries, color: "#888" },
    { label: "Saved Reservations", num: data.totalSaved, color: "#b8005e" },
  ];

  return (
    <>
      <div style={S.grid}>
        {cards.map(c => (
          <div key={c.label} style={{ ...S.card, borderLeft: `4px solid ${c.color}` }}>
            <div style={{ ...S.statNum, color: c.color }}>{c.num}</div>
            <div style={S.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "0 24px 24px" }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Category Distribution</div>
          {data.categoryStats.length === 0 && <div style={{ color: "#666", fontSize: "13px" }}>No data yet</div>}
          {data.categoryStats.map(c => (
            <div key={c.category} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222", fontSize: "13px" }}>
              <span>{c.category}</span>
              <span style={{ fontWeight: "700", color: "#fff" }}>{c.count}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Gender Distribution</div>
          {data.genderStats.length === 0 && <div style={{ color: "#666", fontSize: "13px" }}>No data yet</div>}
          {data.genderStats.map(c => (
            <div key={c.gender} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222", fontSize: "13px" }}>
              <span>{c.gender}</span>
              <span style={{ fontWeight: "700", color: "#fff" }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 24px 24px" }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Recent Users</div>
          {data.recentUsers.length === 0 && <div style={{ color: "#666", fontSize: "13px" }}>No users yet</div>}
          <table style={S.table}>
            <thead><tr><th style={S.th}>ID</th><th style={S.th}>Phone</th><th style={S.th}>Name</th><th style={S.th}>Joined</th></tr></thead>
            <tbody>{data.recentUsers.map(u => (
              <tr key={u.id}><td style={S.td}>#{u.id}</td><td style={S.td}>{u.phone}</td><td style={S.td}>{u.name || "—"}</td><td style={S.td}>{new Date(u.created_at).toLocaleDateString()}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.adminUsers().then(d => { setUsers(d.users); setLoading(false); }).catch(console.error); }, []);

  const filtered = users.filter(u => u.phone.includes(search) || (u.name || "").toLowerCase().includes(search.toLowerCase()) || String(u.id) === search);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user and all their data?")) return;
    await api.adminDeleteUser(id);
    setUsers(users.filter(u => u.id !== id));
    setSelectedUser(null);
  };

  if (selectedUser) {
    return (
      <div style={S.section}>
        <button style={{ ...S.btn("#555"), marginBottom: "16px" }} onClick={() => setSelectedUser(null)}>← Back to Users</button>
        <div style={{ ...S.card, marginBottom: "16px" }}>
          <div style={S.sectionTitle}>User #{selectedUser.user.id} — {selectedUser.user.phone}</div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Name: {selectedUser.user.name || "Not set"} | Joined: {new Date(selectedUser.user.created_at).toLocaleDateString()}</div>
          {selectedUser.profile && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginTop: "12px" }}>
              {[["Category", selectedUser.profile.category], ["School", selectedUser.profile.school], ["Income", selectedUser.profile.income], ["Gender", selectedUser.profile.gender], ["Age", selectedUser.profile.age]].map(([k, v]) => (
                <div key={k} style={{ background: "#111", padding: "10px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "700" }}>{k}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginTop: "2px" }}>{v || "—"}</div>
                </div>
              ))}
            </div>
          )}
          {!selectedUser.profile && <div style={{ color: "#666", fontSize: "13px", marginTop: "8px" }}>No eligibility profile yet</div>}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Saved Reservations ({selectedUser.saved.length})</div>
          {selectedUser.saved.length === 0 && <div style={{ color: "#666", fontSize: "13px" }}>None</div>}
          {selectedUser.saved.map(s => <div key={s.reservation_id} style={{ padding: "6px 0", borderBottom: "1px solid #222", fontSize: "13px" }}>{s.reservation_id} — {new Date(s.created_at).toLocaleDateString()}</div>)}
        </div>
        <div style={{ ...S.card, marginTop: "16px" }}>
          <div style={S.sectionTitle}>Queries ({selectedUser.queries.length})</div>
          {selectedUser.queries.map(q => (
            <div key={q.id} style={{ padding: "10px", background: "#111", borderRadius: "8px", marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", color: "#888" }}>{new Date(q.created_at).toLocaleString()}</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>{q.message}</div>
              <span style={S.badge(q.status === "resolved" ? "#1a6b3c" : q.status === "replied" ? "#1a4e8b" : "#b85c00")}>{q.status}</span>
              {q.admin_reply && <div style={S.replyBox}><div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>ADMIN REPLY:</div><div style={{ fontSize: "12px", color: "#ccc" }}>{q.admin_reply}</div></div>}
            </div>
          ))}
        </div>
        <button style={{ ...S.btn(RED), marginTop: "16px" }} onClick={() => handleDelete(selectedUser.user.id)}>Delete User</button>
      </div>
    );
  }

  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Users ({filtered.length})</div>
      <input style={{ ...S.input, maxWidth: "300px", marginBottom: "16px" }} placeholder="Search by phone, name, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr><th style={S.th}>ID</th><th style={S.th}>Phone</th><th style={S.th}>Name</th><th style={S.th}>Category</th><th style={S.th}>School</th><th style={S.th}>Saved</th><th style={S.th}>Joined</th><th style={S.th}></th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={S.td}>#{u.id}</td>
                <td style={S.td}>{u.phone}</td>
                <td style={S.td}>{u.name || "—"}</td>
                <td style={S.td}>{u.category || "—"}</td>
                <td style={S.td}>{u.school || "—"}</td>
                <td style={S.td}>{u.saved_count}</td>
                <td style={S.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={S.td}><button style={S.btn("#1a4e8b")} onClick={() => api.adminUserDetail(u.id).then(setSelectedUser)}>View</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#666" }}>No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QueriesPanel() {
  const [queries, setQueries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [replyMap, setReplyMap] = useState({});

  const load = (status) => { setLoading(true); setFilter(status); api.adminQueries(status).then(d => { setQueries(d.queries); setLoading(false); }); };

  useEffect(() => { load("all"); }, []);

  const updateStatus = async (id, status) => {
    await api.adminUpdateQuery(id, { status });
    setQueries(queries.map(q => q.id === id ? { ...q, status } : q));
  };

  const sendReply = async (id) => {
    const reply = replyMap[id];
    if (!reply) return;
    await api.adminUpdateQuery(id, { admin_reply: reply, status: "replied" });
    setQueries(queries.map(q => q.id === id ? { ...q, admin_reply: reply, status: "replied" } : q));
    setReplyMap({ ...replyMap, [id]: "" });
  };

  const deleteQuery = async (id) => {
    if (!confirm("Delete this query?")) return;
    await api.adminDeleteQuery(id);
    setQueries(queries.filter(q => q.id !== id));
  };

  const filters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Replied", value: "replied" },
    { label: "Resolved", value: "resolved" },
  ];

  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Queries ({queries.length})</div>
      <div style={S.filterRow}>
        {filters.map(f => (
          <button key={f.value} style={S.navBtn(filter === f.value)} onClick={() => load(f.value)}>{f.label}</button>
        ))}
      </div>
      {loading && <div style={{ color: "#666" }}>Loading...</div>}
      {queries.map(q => (
        <div key={q.id} style={{ ...S.card, marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#fff" }}>{q.name} <span style={{ color: "#888", fontWeight: "400" }}>+91{q.phone}</span></div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>#{q.id} • {new Date(q.created_at).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={S.badge(q.status === "resolved" ? "#1a6b3c" : q.status === "replied" ? "#1a4e8b" : "#b85c00")}>{q.status}</span>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#ccc", marginTop: "10px", lineHeight: 1.6 }}>{q.message}</div>
          {q.admin_reply && <div style={S.replyBox}><div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>ADMIN REPLY:</div><div style={{ fontSize: "12px", color: "#ccc" }}>{q.admin_reply}</div></div>}
          <div style={{ marginTop: "10px" }}>
            <input style={{ ...S.input, display: "inline-block", width: "calc(100% - 120px)" }} placeholder="Type reply..." value={replyMap[q.id] || ""} onChange={e => setReplyMap({ ...replyMap, [q.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && sendReply(q.id)} />
            <button style={{ ...S.btn("#1a4e8b"), marginLeft: "8px", verticalAlign: "middle" }} onClick={() => sendReply(q.id)}>Reply</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {q.status !== "replied" && <button style={S.btn("#1a4e8b")} onClick={() => updateStatus(q.id, "replied")}>Mark Replied</button>}
            {q.status !== "resolved" && <button style={S.btn("#1a6b3c")} onClick={() => updateStatus(q.id, "resolved")}>Resolve</button>}
            <button style={S.btn("#555")} onClick={() => deleteQuery(q.id)}>Delete</button>
          </div>
        </div>
      ))}
      {queries.length === 0 && <div style={S.emptyState}>No {filter === "all" ? "" : filter} queries</div>}
    </div>
  );
}

function SettingsPanel() {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState("");

  const handle = async () => {
    try {
      await api.adminChangePassword(current, newPwd);
      setMsg("Password changed successfully"); setCurrent(""); setNewPwd("");
    } catch (e) { setMsg("Error: " + e.message); }
  };

  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Admin Settings</div>
      <div style={{ ...S.card, maxWidth: "400px" }}>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: "700" }}>CURRENT PASSWORD</div>
        <input style={{ ...S.input, marginBottom: "12px" }} type="password" value={current} onChange={e => setCurrent(e.target.value)} />
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: "700" }}>NEW PASSWORD</div>
        <input style={{ ...S.input, marginBottom: "12px" }} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
        <button style={S.btn(RED)} onClick={handle}>Change Password</button>
        {msg && <div style={{ marginTop: "12px", fontSize: "13px", color: msg.startsWith("Error") ? RED : "#1a6b3c" }}>{msg}</div>}
      </div>
      <div style={{ ...S.card, maxWidth: "460px", marginTop: "16px" }}>
        <div style={S.sectionTitle}>SMS Setup — No GST Needed</div>
        <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.9 }}>
          <strong style={{ color: "#1a6b3c" }}>Option A: Fast2SMS (Recommended)</strong><br/>
          <span style={{ color: "#888" }}>1. Sign up FREE at <a href="https://fast2sms.com" style={{ color: "#1a4e8b" }}>fast2sms.com</a> — just email/phone, <strong>no GST</strong></span><br/>
          <span style={{ color: "#888" }}>2. Copy API Key from Dashboard</span><br/>
          <span style={{ color: "#888" }}>3. In <code>server/.env</code>: <code>FAST2SMS_API_KEY=your_key</code></span><br/><br/>
          <strong style={{ color: "#1a4e8b" }}>Option B: MSG91</strong><br/>
          <span style={{ color: "#888" }}>1. Sign up at <a href="https://msg91.com" style={{ color: "#1a4e8b" }}>msg91.com</a> — select <strong>"Individual"</strong> to skip GST</span><br/>
          <span style={{ color: "#888" }}>2. SMS → Templates: <code>Your OTP is #[OTP#]. Valid for 5 min. - URIMAI</code></span><br/>
          <span style={{ color: "#888" }}>3. In <code>server/.env</code>: <code>MSG91_AUTH_KEY</code> + <code>MSG91_TEMPLATE_ID</code></span><br/><br/>
          <span style={{ color: "#b85c00" }}>No provider configured = demo mode (OTP alert popup) — still works!</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("urimai_admin_token");
    if (token) {
      api.adminDashboard().then(() => {
        setAdmin({ username: "admin" });
      }).catch(() => { localStorage.removeItem("urimai_admin_token"); });
    }
  }, []);

  if (!admin) return <Login onLogin={setAdmin} />;

  const logout = () => { localStorage.removeItem("urimai_admin_token"); setAdmin(null); };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "users", label: "Users" },
    { id: "queries", label: "Queries" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <div>
          <span style={S.logo}>URIMAI</span>
          <span style={S.logoSpan}>Admin Panel</span>
        </div>
        <div style={S.nav}>
          {tabs.map(t => <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
          <button style={S.btn("#555")} onClick={logout}>Logout</button>
        </div>
      </div>
      {tab === "dashboard" && <Dashboard />}
      {tab === "users" && <UsersPanel />}
      {tab === "queries" && <QueriesPanel />}
      {tab === "settings" && <SettingsPanel />}
    </div>
  );
}
