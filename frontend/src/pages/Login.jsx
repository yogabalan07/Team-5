import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const ROLES = [
  { value: "Admin", label: "Admin", icon: "🛡️", desc: "Full system access" },
  { value: "Manager", label: "Manager", icon: "📋", desc: "Manage orders & staff" },
  { value: "User", label: "Employee", icon: "👤", desc: "Basic access" },
];

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    setForm({ username: "", password: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Please select a role first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(form.username, form.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  return (
    <div style={s.wrapper}>
      <div style={s.card}>

        {/* Brand */}
        <div style={s.brand}>
          
          <span style={s.brandName}>Inventory Management System</span>
        </div>

        <h1 style={s.title}>Sign in</h1>
        <p style={s.subtitle}>Select your role to continue</p>

        {/* Role selector */}
        <div style={s.roleGrid}>
          {ROLES.map((role) => {
            const active = selectedRole?.value === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role)}
                style={{
                  ...s.roleCard,
                  ...(active ? s.roleCardActive : {}),
                }}
              >
                <span style={s.roleIcon}>{role.icon}</span>
                <span style={{ ...s.roleLabel, color: active ? "#a5b4fc" : "#fff" }}>
                  {role.label}
                </span>
                <span style={s.roleDesc}>{role.desc}</span>
                {active && <div style={s.roleCheck}>✓</div>}
              </button>
            );
          })}
        </div>

        {/* Credentials form — shown after role is picked */}
        <div style={{
          ...s.formWrap,
          maxHeight: selectedRole ? "400px" : "0px",
          opacity: selectedRole ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s ease, opacity 0.3s ease",
        }}>
          <form onSubmit={handleLogin} style={s.form}>

            <div style={s.divider}>
              <span style={s.dividerLine} />
              <span style={s.dividerText}>
                {selectedRole ? `${selectedRole.label} credentials` : ""}
              </span>
              <span style={s.dividerLine} />
            </div>

            {/* Username */}
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="username">Username</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>👤</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  style={s.input}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="password">Password</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={s.input}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div style={s.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
            >
              {loading ? "⟳ Signing in..." : `Sign In as ${selectedRole?.label}`}
            </button>
          </form>
        </div>

        <p style={s.footer}>
          MySQL · <span style={{ color: "#6366f1" }}>Clever Cloud</span> · bz58dt6t4ypdlmtgr532
        </p>
      </div>
    </div>
  );
};

const s = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    textAlign: "center",
  },
  brand: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "10px", marginBottom: "24px",
  },
  brandIcon: {
    width: "40px", height: "40px", borderRadius: "10px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: "700", fontSize: "18px",
  },
  brandName: { color: "#fff", fontWeight: "700", fontSize: "20px", letterSpacing: "0.5px" },
  title: { color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px 0" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 24px 0" },

  // Role grid
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "4px",
  },
  roleCard: {
    position: "relative",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "4px",
    padding: "14px 8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  roleCardActive: {
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.6)",
    boxShadow: "0 0 16px rgba(99,102,241,0.25)",
  },
  roleIcon: { fontSize: "22px", marginBottom: "2px" },
  roleLabel: { fontSize: "13px", fontWeight: "600" },
  roleDesc: { fontSize: "10px", color: "rgba(255,255,255,0.4)", lineHeight: "1.3" },
  roleCheck: {
    position: "absolute", top: "6px", right: "8px",
    color: "#a5b4fc", fontSize: "11px", fontWeight: "700",
  },

  // Form
  formWrap: { textAlign: "left" },
  form: { display: "flex", flexDirection: "column", gap: "14px", paddingTop: "4px" },
  divider: {
    display: "flex", alignItems: "center", gap: "10px", margin: "8px 0 4px",
  },
  dividerLine: {
    flex: 1, height: "1px", background: "rgba(255,255,255,0.1)",
  },
  dividerText: { color: "rgba(255,255,255,0.35)", fontSize: "11px", whiteSpace: "nowrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "500" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "13px", fontSize: "15px", pointerEvents: "none" },
  input: {
    width: "100%", padding: "11px 12px 11px 40px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", color: "#fff", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  },
  errorBox: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: "8px", color: "#fca5a5", fontSize: "12px",
    padding: "9px 12px", display: "flex", alignItems: "center", gap: "8px",
  },
  submitBtn: {
    padding: "13px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: "10px", color: "#fff",
    fontSize: "14px", fontWeight: "600", cursor: "pointer",
    letterSpacing: "0.3px", marginTop: "4px",
  },
  footer: { marginTop: "24px", color: "rgba(255,255,255,0.25)", fontSize: "11px" },

  // Success
  successIcon: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "28px", margin: "0 auto 18px",
  },
  welcomeTitle: { color: "#fff", fontSize: "22px", margin: "0 0 6px 0" },
  welcomeName: { color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 12px 0" },
  roleBadge: {
    display: "inline-block",
    background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)",
    color: "#a5b4fc", borderRadius: "20px", padding: "4px 14px",
    fontSize: "13px", fontWeight: "500", marginBottom: "22px",
  },
  logoutBtn: {
    display: "block", width: "100%", padding: "12px",
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", color: "#fff", fontSize: "14px", cursor: "pointer",
  },
};

export default LoginPage;
