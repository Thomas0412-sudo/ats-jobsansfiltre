export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cv, jobDescription } = req.body;

  if (!cv || !jobDescription) {
    return res.status(400).json({ error: 'CV et description de poste requis' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `Tu es un expert RH et recruteur senior. Analyse ce CV par rapport à cette offre d'emploi.

OFFRE D'EMPLOI :
${jobDescription}

CV DU CANDIDAT :
${cv}

Fournis une analyse structurée en JSON avec exactement ce format :
{
  "score": <nombre entre 0 et 100>,
  "recommandation": "<Retenir | À étudier | Rejeter>",
  "points_forts": ["<point 1>", "<point 2>", "<point 3>"],
  "points_faibles": ["<point 1>", "<point 2>"],
  "resume": "<résumé en 2-3 phrases du profil par rapport au poste>"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur Gemini:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'analyse' });
  }
}
