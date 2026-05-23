import React, { useState, useCallback } from "react";
import axios from "axios";
import "./App.css";

const CHAR_SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const OPTIONS = [
  { key: "upper",   label: "Uppercase", example: "ABC" },
  { key: "lower",   label: "Lowercase", example: "abc" },
  { key: "digits",  label: "Numbers",   example: "123" },
  { key: "symbols", label: "Symbols",   example: "!@#" },
];

function getPoolSize(opts) {
  return Object.entries(CHAR_SETS)
    .filter(([k]) => opts[k])
    .reduce((acc, [, v]) => acc + v.length, 0);
}

function getEntropyBits(length, poolSize) {
  if (!poolSize) return 0;
  return Math.round(length * Math.log2(poolSize));
}

function getCombosLabel(length, poolSize) {
  if (!poolSize) return "—";
  const exp = Math.round(length * Math.log10(poolSize));
  return exp >= 6 ? `10^${exp}` : Math.pow(poolSize, length).toLocaleString();
}

function getStrength(activeCount, length) {
  const score = activeCount + (length >= 20 ? 3 : length >= 16 ? 2 : length >= 12 ? 1 : 0);
  if (score >= 6) return { label: "Very Strong", level: 4, pct: "100%" };
  if (score >= 5) return { label: "Strong",      level: 3, pct: "75%"  };
  if (score >= 3) return { label: "Medium",      level: 2, pct: "45%"  };
  return              { label: "Weak",        level: 1, pct: "20%"  };
}

export default function App() {
  const [length,    setLength]    = useState(16);
  const [opts,      setOpts]      = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [password,  setPassword]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const activeCount = Object.values(opts).filter(Boolean).length;
  const poolSize    = getPoolSize(opts);
  const entropyBits = getEntropyBits(length, poolSize);
  const strength    = getStrength(activeCount, length);

  const toggleOpt = useCallback((key) => {
    setOpts((prev) => {
      const active = Object.values(prev).filter(Boolean).length;
      if (prev[key] && active <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const generatePassword = async () => {
    if (!activeCount) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "https://portfolio-production-2376.up.railway.app/generate/",
        {
          length,
          use_upper:   opts.upper,
          use_lower:   opts.lower,
          use_digits:  opts.digits,
          use_symbols: opts.symbols,
        }
      );
      setPassword(res.data.password);
      setCopied(false);
    } catch {
      setError("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="pg-root">
      <div className="pg-card">

        {/* Header */}
        <header className="pg-header">
          <div className="pg-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 3v3.5l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Security Tool
          </div>
          <h1 className="pg-title">Password<br/><span>Generator</span></h1>
        </header>

        {/* Password Display */}
        <div className={`pg-display ${password ? "has-value" : ""} ${error ? "has-error" : ""}`}>
          <p className="pg-pw-text">
            {error
              ? <span className="pg-error-text">{error}</span>
              : password
              ? password
              : <span className="pg-placeholder">Generate a password…</span>
            }
          </p>
          <div className="pg-display-actions">
            <button
              className={`pg-icon-btn ${copied ? "pg-icon-btn--success" : ""}`}
              onClick={copyToClipboard}
              disabled={!password}
              title="Copy password"
              aria-label="Copy password"
            >
              {copied
                ? <CheckIcon />
                : <CopyIcon />
              }
            </button>
            <button
              className={`pg-icon-btn ${loading ? "pg-icon-btn--loading" : ""}`}
              onClick={generatePassword}
              disabled={loading}
              title="New password"
              aria-label="Generate new password"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Strength Bar */}
        <div className="pg-strength-wrap" aria-label={`Password strength: ${strength.label}`}>
          <div className="pg-strength-track">
            <div
              className={`pg-strength-fill pg-strength--${strength.level}`}
              style={{ width: password ? strength.pct : "0%" }}
            />
          </div>
          <span className={`pg-strength-label pg-strength-label--${strength.level} ${!password ? "pg-strength-label--empty" : ""}`}>
            {password ? strength.label : "—"}
          </span>
        </div>

        {/* Settings */}
        <div className="pg-settings">

          {/* Length */}
          <div className="pg-section">
            <div className="pg-section-header">
              <span className="pg-section-label">Length</span>
              <span className="pg-length-badge">{length}</span>
            </div>
            <input
              type="range"
              className="pg-range"
              min={4}
              max={32}
              step={1}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              aria-label="Password length"
            />
            <div className="pg-range-ticks">
              <span>4</span><span>12</span><span>20</span><span>32</span>
            </div>
          </div>

          {/* Divider */}
          <div className="pg-divider" />

          {/* Character Sets */}
          <div className="pg-section">
            <span className="pg-section-label">Character sets</span>
            <div className="pg-opts-grid">
              {OPTIONS.map(({ key, label, example }) => (
                <button
                  key={key}
                  className={`pg-opt ${opts[key] ? "pg-opt--active" : ""}`}
                  onClick={() => toggleOpt(key)}
                  aria-pressed={opts[key]}
                >
                  <span className="pg-opt-check" aria-hidden="true">
                    {opts[key] && <CheckIcon size={10} />}
                  </span>
                  <span className="pg-opt-label">{label}</span>
                  <span className="pg-opt-example">{example}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="pg-divider" />

          {/* Entropy Stats */}
          <div className="pg-stats-row">
            <div className="pg-stat">
              <span className="pg-stat-value">{poolSize}</span>
              <span className="pg-stat-key">pool size</span>
            </div>
            <div className="pg-stat-sep" />
            <div className="pg-stat">
              <span className="pg-stat-value">{entropyBits}</span>
              <span className="pg-stat-key">entropy bits</span>
            </div>
            <div className="pg-stat-sep" />
            <div className="pg-stat">
              <span className="pg-stat-value">{getCombosLabel(length, poolSize)}</span>
              <span className="pg-stat-key">combinations</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={`pg-gen-btn ${loading ? "pg-gen-btn--loading" : ""}`}
          onClick={generatePassword}
          disabled={loading || !activeCount}
        >
          {loading ? (
            <>
              <SpinnerIcon />
              Generating…
            </>
          ) : (
            <>
              <ShieldIcon />
              Generate Secure Password
            </>
          )}
        </button>

      </div>
    </div>
  );
}

/* ── Inline SVG Icons ───────────────────────────────────────────── */

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="pg-spinner">
      <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
    </svg>
  );
}