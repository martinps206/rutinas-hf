import React, { useState, useRef } from "react";

const TEAL = "#0F6E56";
const TEAL_LIGHT = "#E1F5EE";
const TEAL_MID = "#1D9E75";

const SYSTEM_PROMPT = `Sos asistente de una profesora de running del equipo "Hábito Running". Tu tarea es generar planillas de entrenamiento de 2 semanas (8 días) personalizadas para cada alumno, en formato texto plano listo para enviar por WhatsApp.

PLAN BASE (8 días):
... (texto omitido por brevedad en el bundle) ...`;

export default function App() {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Intermedio");
  const [days, setDays] = useState("5");
  const [goals, setGoals] = useState("");
  const [mods, setMods] = useState("");
  const [note, setNote] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [outName, setOutName] = useState("");
  const outputRef = useRef(null);

  async function generate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    setOutName(name.trim());

    const userPrompt = `Generá la planilla para:\nNombre: ${name.trim()}\nNivel: ${level}\nDías disponibles: ${days} días por semana\nObjetivos / situación: ${goals || "No especificado"}\nModificaciones de ejercicios: ${mods || "Ninguna"}\nNota motivacional: ${note || "Ninguna"}`;

    try {
      const API_URL = import.meta.env.DEV ? "http://localhost:8787/api/generate" : "/api/generate";
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), level, days, goals, mods, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error en la generación");
      const text = data.text || "";
      if (!text) throw new Error("Respuesta vacía");
      setOutput(text);
      setHistory((h) => [{ name: name.trim(), level, text }, ...h].slice(0, 6));
    } catch (e) {
      setError("No se pudo generar la planilla. Revisá la conexión e intentá de nuevo.");
    }
    setLoading(false);
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const levels = ["Principiante", "Intermedio", "Avanzado"];

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#f7f7f4", padding: "0" }}>
      <div style={{ background: TEAL, padding: "18px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>🏃</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "0.01em" }}>Hábito Running</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "sans-serif" }}>Generador de planillas personalizadas</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 64px)" }}>
        <div style={{ width: 320, background: "#fff", borderRight: "1px solid #e8e5df", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          <Section title="Alumno">
            <Field label="Nombre completo">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Valentina López"
                onKeyDown={e => e.key === "Enter" && generate()}
                style={inputStyle}
              />
            </Field>

            <Field label="Nivel">
              <div style={{ display: "flex", gap: 6 }}>
                {levels.map(l => (
                  <button key={l} onClick={() => setLevel(l)} style={{
                    flex: 1, padding: "7px 4px", fontSize: 12, fontFamily: "sans-serif",
                    border: `1.5px solid ${level === l ? TEAL_MID : "#d5d2ca"}`,
                    borderRadius: 8, cursor: "pointer",
                    background: level === l ? TEAL_LIGHT : "#fff",
                    color: level === l ? TEAL : "#666",
                    fontWeight: level === l ? 600 : 400,
                    transition: "all 0.15s"
                  }}>{l}</button>
                ))}
              </div>
            </Field>

            <Field label="Días de entrenamiento por semana">
              <select value={days} onChange={e => setDays(e.target.value)} style={inputStyle}>
                <option value="3">3 días</option>
                <option value="4">4 días</option>
                <option value="5">5 días</option>
                <option value="6">6 días</option>
              </select>
            </Field>
          </Section>

          <Section title="Personalización">
            <Field label="Objetivos / situación particular">
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="Ej: quiere bajar 5K a 5:30, tiene rodilla sensible, prepara una carrera de 10K..."
                style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              />
            </Field>
            <Field label="Modificaciones de ejercicios">
              <textarea
                value={mods}
                onChange={e => setMods(e.target.value)}
                placeholder="Ej: reemplazar series de 1000m por 600m, evitar fartlek..."
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              />
            </Field>
            <Field label="Nota motivacional">
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ej: ¡Seguís mejorando semana a semana!"
                style={inputStyle}
              />
            </Field>
          </Section>

          <button
            onClick={generate}
            disabled={loading || !name.trim()}
            style={{
              padding: "13px", borderRadius: 10, border: "none",
              background: !name.trim() || loading ? "#b2d8cb" : TEAL_MID,
              color: "#fff", fontSize: 14, fontFamily: "sans-serif", fontWeight: 600,
              cursor: !name.trim() || loading ? "not-allowed" : "pointer",
              transition: "background 0.2s", letterSpacing: "0.02em"
            }}
          >
            {loading ? "⏳ Generando..." : "▶ Generar planilla"}
          </button>

          {history.length > 0 && (
            <Section title="Generados hoy">
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setOutput(h.text); setOutName(h.name); }}
                    style={{
                      textAlign: "left", padding: "8px 10px", borderRadius: 8,
                      border: "1px solid #e0ddd5", background: "#fafaf8",
                      cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                    <span style={{ fontSize: 13, fontFamily: "sans-serif", color: "#333" }}>{h.name}</span>
                    <span style={{ fontSize: 11, color: TEAL, fontFamily: "sans-serif" }}>{h.level}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 24px", borderBottom: "1px solid #e8e5df", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontFamily: "sans-serif", color: "#444", fontWeight: 500 }}>
              {outName ? `✓ Planilla de ${outName}` : "Vista previa — lista para WhatsApp"}
            </span>
            <button
              onClick={copy}
              disabled={!output}
              style={{
                padding: "7px 18px", borderRadius: 8, fontSize: 13, fontFamily: "sans-serif",
                border: `1px solid ${copied ? TEAL_MID : "#c8c4bc"}`,
                background: copied ? TEAL_LIGHT : "#fff",
                color: copied ? TEAL : "#555",
                cursor: output ? "pointer" : "not-allowed",
                fontWeight: copied ? 600 : 400, transition: "all 0.2s"
              }}
            >
              {copied ? "¡Copiado! ✓" : "Copiar texto"}
            </button>
          </div>

          <div ref={outputRef} style={{
            flex: 1, padding: "24px 28px",
            fontFamily: "sans-serif", fontSize: 13.5, lineHeight: 1.75,
            color: "#222", whiteSpace: "pre-wrap", overflowY: "auto",
            background: "#fafaf8"
          }}>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 14, color: "#888" }}>
                <div style={{ width: 32, height: 32, border: `3px solid #d0ede5`, borderTopColor: TEAL_MID, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13 }}>Generando planilla para {name}…</span>
              </div>
            )}
            {!loading && error && (
              <div style={{ background: "#fff3f3", border: "1px solid #f5b8b8", borderRadius: 10, padding: "14px 18px", color: "#a33", fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}
            {!loading && !error && !output && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: "#aaa" }}>
                <span style={{ fontSize: 36 }}>🏃</span>
                <span style={{ fontSize: 13 }}>Completá los datos del alumno y generá su planilla</span>
              </div>
            )}
            {!loading && output && output}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontFamily: "sans-serif", color: "#666" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: "sans-serif",
  border: "1px solid #d5d2ca", borderRadius: 8, background: "#fff",
  color: "#222", outline: "none", boxSizing: "border-box"
};
