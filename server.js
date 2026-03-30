import http from "http";
import { URL } from "url";

const PORT = process.env.PORT || 8787;

function jsonResponse(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleGenerate(req, res) {
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const { name, level, days, goals, mods, note } = body || {};
    if (!name) return jsonResponse(res, 400, { error: "Falta el nombre del alumno" });

    const SYSTEM_PROMPT = `Sos asistente de una profesora de running del equipo "Hábito Running". Tu tarea es generar planillas de entrenamiento de 2 semanas (8 días) personalizadas para cada alumno, en formato texto plano listo para enviar por WhatsApp.`;
    const userPrompt = `Generá la planilla para:\nNombre: ${name.trim()}\nNivel: ${level}\nDías disponibles: ${days} días por semana\nObjetivos / situación: ${goals || "No especificado"}\nModificaciones de ejercicios: ${mods || "Ninguna"}\nNota motivacional: ${note || "Ninguna"}`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonResponse(res, 500, { error: "Falta ANTHROPIC_API_KEY en el entorno" });

    const anthRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }] }),
    });

    const data = await anthRes.json().catch(async () => ({ raw: await anthRes.text() }));
    if (!anthRes.ok) {
      return jsonResponse(res, anthRes.status || 500, { error: data.error || data.raw || "Error desde el proveedor" });
    }

    const text = (data.content?.map?.((b) => b.text || "").join("") || data.text) || "";
    if (!text) return jsonResponse(res, 500, { error: "Respuesta vacía del proveedor" });

    return jsonResponse(res, 200, { text });
  } catch (err) {
    return jsonResponse(res, 500, { error: err.message || String(err) });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/generate") return handleGenerate(req, res);
    // simple health
    if (req.method === "GET" && url.pathname === "/") return jsonResponse(res, 200, { status: "ok" });
    return jsonResponse(res, 404, { error: "Not found" });
  } catch (err) {
    return jsonResponse(res, 500, { error: String(err) });
  }
});

server.listen(PORT, () => console.log(`Dev API server listening on http://localhost:${PORT}`));
