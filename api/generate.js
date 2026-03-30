export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, level, days, goals, mods, note } = req.body || {};
  if (!name) return res.status(400).json({ error: "Falta el nombre del alumno" });

  const SYSTEM_PROMPT = `Sos asistente de una profesora de running del equipo "Hábito Running". Tu tarea es generar planillas de entrenamiento de 2 semanas (8 días) personalizadas para cada alumno, en formato texto plano listo para enviar por WhatsApp.

PLAN BASE (8 días):
Día 1: Entrada en calor: Movilidad + Skipping A (4x30) + Skipping B (4x30) + Salticados (4x10). Actividad: carrera continua 50 min progresiva, cada 10 min aumento el ritmo y lo mantengo, 5 pasadas de 100m caminando. Enfriamiento: elongación. Nota: enfocate en mantener cada ritmo estable.
Día 2: Entrada en calor: Movilidad. Actividad: carrera continua 40 min trote suave + 12 pasadas de 100m. Enfriamiento: elongación. Nota: enfocate en un ritmo constante.
Día 3: Entrada en calor: Movilidad + Skipping A (4x30) + Skipping B (4x30) + Salticados (4x10). Actividad: Fartlek 1 hora. Enfriamiento: elongación. Nota: calentamiento previo / trabajo de calidad y ritmo / concéntrate en la técnica.
Día 4: Entrada en calor: Movilidad. Actividad: carrera larga continua 50 min trote suave. Enfriamiento: elongación. Nota: enfocate en un ritmo suave y tranquilo que te permita estar cómodo.
Día 5: Entrada en calor: Movilidad + Skipping A (4x30) + Skipping B (4x30) + Salticados (4x10). Actividad: 15 min trote + Test 1600 metros. Enfriamiento: elongación. Nota: enfocate en un comienzo progresivo a máximo esfuerzo.
Día 6: Entrada en calor: Movilidad + Skipping A (4x30) + Skipping B (4x30) + Salticados (4x10). Actividad: 3 km trote + 4 pasadas de 1000m ágiles con recuperación al trote de 2 min + 2 km trote muy suave. Enfriamiento: elongación. Nota: calentamiento previo / trabajo de calidad y ritmo / concéntrate en la técnica.
Día 7: Entrada en calor: Movilidad. Actividad: 1 hora trote suave. Enfriamiento: elongación. Nota: enfocate en un ritmo suave y tranquilo.
Día 8: Entrada en calor: Movilidad. Actividad: 1:20 hs trote suave. Enfriamiento: elongación. Nota: enfocate en un ritmo suave y tranquilo.

INSTRUCCIONES DE PERSONALIZACIÓN:
- Adapta duraciones e intensidades según el nivel del alumno (Principiante: reduce tiempos y volumen; Intermedio: usa el plan base; Avanzado: aumenta volumen y añade variantes más exigentes).
- Si el alumno tiene menos días disponibles, consolida o elimina sesiones de forma coherente (priorizando variedad de estímulos).
- Aplica las modificaciones de ejercicios que se indiquen.
- Incluí los objetivos y situación particular del alumno en el tono y en las notas.
- Si hay nota motivacional personal, inclúila al final.`;

  const userPrompt = `Generá la planilla para:\nNombre: ${name.trim()}\nNivel: ${level}\nDías disponibles: ${days} días por semana\nObjetivos / situación: ${goals || "No especificado"}\nModificaciones de ejercicios: ${mods || "Ninguna"}\nNota motivacional: ${note || "Ninguna"}`;

  try {
    const anthRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await anthRes.json().catch(async () => ({ raw: await anthRes.text() }));
    if (!anthRes.ok) {
      return res.status(anthRes.status || 500).json({ error: data.error || data.raw || 'Error desde el proveedor' });
    }

    const text = (data.content?.map?.((b) => b.text || "").join("") || data.text) || "";
    if (!text) return res.status(500).json({ error: "Respuesta vacía del proveedor" });

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
