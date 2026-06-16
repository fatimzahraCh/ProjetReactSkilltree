// src/api/llmService.ts

// 🔑 On centralise la clé ici pour que les deux fonctions puissent l'utiliser
const API_KEY = "AIzaSyCrbRVL80tnEok_B2k9tMCyKgtVceA0OIE";

// ============================================================================
// 1. GÉNÉRATION DE L'ARBRE DE COMPÉTENCES
// ============================================================================

const SYSTEM_PROMPT = `Tu es le moteur d'intelligence artificielle de "Synapse", une application d'apprentissage.
Ton rôle est de prendre les compétences actuelles de l'utilisateur et son objectif, et de générer un parcours d'apprentissage sous forme d'arbre interactif.

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans AUCUN texte avant ou après, et sans utiliser de balises markdown comme \`\`\`json.
Génère un arbre logique de 4 à 5 compétences pour atteindre l'objectif.
Les positions Y doivent augmenter de 150 pour chaque niveau (ex: niveau 1 -> y: 50, niveau 2 -> y: 200).

Structure JSON OBLIGATOIRE :
{
  "xp": 0,
  "nodes": [
    { "id": "1", "position": { "x": 250, "y": 50 }, "type": "custom", "data": { "label": "Nom de la compétence", "status": "completed" } },
    { "id": "2", "position": { "x": 100, "y": 200 }, "type": "custom", "data": { "label": "Nom de la compétence", "status": "unlocked" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true }
  ]
}`;

export const generateSkillTree = async (currentSkills: string, targetGoal: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT + "\n\nJe sais déjà faire : " + currentSkills + "\nMon objectif est : " + targetGoal }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Erreur lors de la génération de l'arbre avec Gemini:", error);
    throw error;
  }
};


// ============================================================================
// 2. GÉNÉRATION DES COURS ET DES QUIZ
// ============================================================================

const COURSE_SYSTEM_PROMPT = `Tu es un professeur expert. L'utilisateur veut apprendre une compétence spécifique.
Génère un mini-cours structuré et un quiz de 2 questions pour valider cette compétence.
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, et sans balises markdown.

Structure JSON OBLIGATOIRE :
{
  "course": {
    "introduction": "Un paragraphe d'explication simple et clair.",
    "keyPoints": ["Point clé 1 expliquant un concept", "Point clé 2", "Point clé 3"],
    "youtubeSearchTerms": ["Mots clés précis pour trouver un bon tuto YouTube", "Autre recherche YouTube"]
  },
  "quiz": [
    {
      "question": "Une question pour tester la compréhension ?",
      "options": ["Mauvaise réponse", "Bonne réponse", "Autre mauvaise réponse"],
      "correctIndex": 1
    },
    {
      "question": "Une autre question ?",
      "options": ["Réponse A", "Réponse B", "Réponse C"],
      "correctIndex": 0
    }
  ]
}`;

export const generateCourseAndQuiz = async (skillName: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: COURSE_SYSTEM_PROMPT + "\n\nLa compétence à enseigner est : " + skillName }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    const cleanText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erreur lors de la génération du cours avec Gemini:", error);
    throw error;
  }
};