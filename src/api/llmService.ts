const GEMINI_MODEL = 'gemini-2.5-flash';

const CACHE_PREFIX = 'synapse_cache_';
const RATE_LIMIT_KEY = CACHE_PREFIX + 'rate_limit';

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_LLM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Cl├® API manquante. Ajoutez VITE_LLM_API_KEY dans le fichier .env ├á la racine du projet synapse, puis red├®marrez npm run dev.'
    );
  }
  return apiKey;
}

// ============================================================================
// PERSISTENT CACHE (localStorage)
// ============================================================================

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry.expiry && Date.now() > entry.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T, ttlMs = 300_000): void {
  try {
    const entry = { data, expiry: Date.now() + ttlMs };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage may be full; silently ignore
  }
}

function cacheKeyTree(currentSkills: string, targetGoal: string): string {
  const raw = currentSkills + '||' + targetGoal;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'tree_' + Math.abs(hash);
}

function cacheKeyCourse(skillName: string): string {
  return 'course_' + skillName.trim().toLowerCase();
}

// ============================================================================
// CLIENT-SIDE RATE LIMITER
// ============================================================================

const MAX_REQUESTS_PER_WINDOW = 15;
const WINDOW_MS = 60_000;

function getRateLimitState(): { timestamps: number[] } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { timestamps: [] };
}

function saveRateLimitState(state: { timestamps: number[] }): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function getRemainingQuota(): { remaining: number; resetAfterMs: number } {
  const state = getRateLimitState();
  const now = Date.now();
  const valid = state.timestamps.filter(t => now - t < WINDOW_MS);
  return {
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - valid.length),
    resetAfterMs: valid.length > 0 ? WINDOW_MS - (now - valid[0]) : 0,
  };
}

function recordRequest(): void {
  const state = getRateLimitState();
  const now = Date.now();
  state.timestamps.push(now);
  const cutoff = now - WINDOW_MS;
  state.timestamps = state.timestamps.filter(t => t > cutoff);
  saveRateLimitState(state);
}

async function waitForQuota(): Promise<void> {
  const { remaining, resetAfterMs } = getRemainingQuota();
  if (remaining > 0) return;
  const waitMs = Math.min(resetAfterMs + 500, 60_000);
  console.warn(`[Rate Limit] Quota ├®puis├®, attente de ${Math.round(waitMs / 1000)}s`);
  await new Promise(resolve => setTimeout(resolve, waitMs));
}

// ============================================================================
// GEMINI API CALL
// ============================================================================

async function callGemini(systemPrompt: string, userMessage: string) {
  const apiKey = getApiKey();

  await waitForQuota();
  recordRequest();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + userMessage }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody?.error?.message ??
      `Erreur HTTP ${response.status} lors de l'appel ├á Gemini.`;

    if (response.status === 403) {
      throw new Error(
        `Cl├® API Gemini refus├®e : ${message} Cr├®ez une nouvelle cl├® sur https://aistudio.google.com/apikey`
      );
    }

    if (response.status === 429 || response.status === 503) {
      const retrySeconds = parseRetryAfter(message);
      throw new QuotaError(message, retrySeconds);
    }

    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('R├®ponse vide de Gemini. R├®essayez dans quelques instants.');
  }

  const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

// ============================================================================
// QUOTA ERROR
// ============================================================================

class QuotaError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number = 60) {
    super(message);
    this.name = 'QuotaError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) return Math.ceil(parseFloat(match[1]));
  const match2 = message.match(/retry after (\d+) seconds/i);
  if (match2) return parseInt(match2[1], 10);
  return 60;
}

export { QuotaError };

// ============================================================================
// 1. G├ëN├ëRATION DE L'ARBRE DE COMP├ëTENCES
// ============================================================================

const SYSTEM_PROMPT = `Tu es le moteur d'intelligence artificielle de "Synapse", une application d'apprentissage.
Ton r├┤le est de prendre les comp├®tences actuelles de l'utilisateur et son objectif, et de g├®n├®rer un parcours d'apprentissage sous forme d'arbre interactif.

Tu dois r├®pondre UNIQUEMENT avec un objet JSON valide, sans AUCUN texte avant ou apr├¿s, et sans utiliser de balises markdown comme \`\`\`json.
G├®n├¿re un arbre logique de 4 ├á 5 comp├®tences pour atteindre l'objectif.
Les positions Y doivent augmenter de 150 pour chaque niveau (ex: niveau 1 -> y: 50, niveau 2 -> y: 200).

Structure JSON OBLIGATOIRE :
{
  "xp": 0,
  "nodes": [
    { "id": "1", "position": { "x": 250, "y": 50 }, "type": "custom", "data": { "label": "Nom de la comp├®tence", "status": "completed" } },
    { "id": "2", "position": { "x": 100, "y": 200 }, "type": "custom", "data": { "label": "Nom de la comp├®tence", "status": "unlocked" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true }
  ]
}`;

function buildFallbackTree(currentSkills: string, targetGoal: string) {
  const goal = targetGoal || 'votre objectif';
  const skills = currentSkills || 'les bases';
  return {
    xp: 0,
    nodes: [
      { id: '1', position: { x: 250, y: 50 }, type: 'custom', data: { label: `Consolider ${skills}`, status: 'completed' } },
      { id: '2', position: { x: 100, y: 200 }, type: 'custom', data: { label: `Fondamentaux de ${goal}`, status: 'unlocked' } },
      { id: '3', position: { x: 400, y: 200 }, type: 'custom', data: { label: 'Mise en pratique', status: 'locked' } },
      { id: '4', position: { x: 250, y: 350 }, type: 'custom', data: { label: `Ma├«triser ${goal}`, status: 'locked' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e1-3', source: '1', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4', animated: true },
      { id: 'e3-4', source: '3', target: '4', animated: true },
    ],
  };
}

interface GeneratedTree {
  xp: number;
  nodes: { id: string; position: { x: number; y: number }; type: string; data: { label: string; status: string } }[];
  edges: { id: string; source: string; target: string; animated?: boolean }[];
}

export const generateSkillTree = async (currentSkills: string, targetGoal: string) => {
  const key = cacheKeyTree(currentSkills, targetGoal);
  const cached = cacheGet<GeneratedTree>(key);
  if (cached) return cached;

  try {
    const result = await callGemini(
      SYSTEM_PROMPT,
      `Je sais d├®j├á faire : ${currentSkills}\nMon objectif est : ${targetGoal}`
    );
    cacheSet(key, result, 600_000);
    return result;
  } catch (error) {
    console.error("Erreur lors de la g├®n├®ration de l'arbre avec Gemini:", error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('Cl├® API manquante') || message.includes('Cl├® API Gemini refus├®e')) {
      throw error;
    }

    const fallback = buildFallbackTree(currentSkills, targetGoal);
    return fallback;
  }
};

// ============================================================================
// 2. G├ëN├ëRATION DES COURS ET DES QUIZ
// ============================================================================

const COURSE_SYSTEM_PROMPT = `Tu es un professeur expert. L'utilisateur veut apprendre une comp├®tence sp├®cifique.
G├®n├¿re un mini-cours structur├® et un quiz de 2 questions pour valider cette comp├®tence.
Tu dois r├®pondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou apr├¿s, et sans balises markdown.

Structure JSON OBLIGATOIRE :
{
  "course": {
    "introduction": "Un paragraphe d'explication simple et clair.",
    "keyPoints": ["Point cl├® 1 expliquant un concept", "Point cl├® 2", "Point cl├® 3"],
    "youtubeSearchTerms": ["Mots cl├®s pr├®cis pour trouver un bon tuto YouTube", "Autre recherche YouTube"]
  },
  "quiz": [
    {
      "question": "Une question pour tester la compr├®hension ?",
      "options": ["Mauvaise r├®ponse", "Bonne r├®ponse", "Autre mauvaise r├®ponse"],
      "correctIndex": 1
    },
    {
      "question": "Une autre question ?",
      "options": ["R├®ponse A", "R├®ponse B", "R├®ponse C"],
      "correctIndex": 0
    }
  ]
}`;

export interface CourseContent {
  course: {
    introduction: string;
    keyPoints: string[];
    youtubeSearchTerms: string[];
  };
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
  isFallback?: boolean;
  fallbackReason?: string;
  retryAfterSeconds?: number;
}

const QUESTION_POOL = [
  {
    question: (s: string) => `Quelle est la premi├¿re ├®tape pour apprendre "${s}" ?`,
    options: ['Comprendre les concepts de base', 'Acheter du mat├®riel co├╗teux', 'Trouver un mentor'],
    answer: 0,
  },
  {
    question: (s: string) => `Dans "${s}", quelle pratique est la plus efficace ?`,
    options: ['Lire sans appliquer', 'Pratiquer r├®guli├¿rement avec des projets', 'Regarder des vid├®os passivement'],
    answer: 1,
  },
  {
    question: (s: string) => `Quel est l'objectif principal de "${s}" dans un parcours d'apprentissage ?`,
    options: ['Ignorer les bases', 'Acqu├®rir des fondamentaux solides', 'Aller directement au niveau expert'],
    answer: 1,
  },
  {
    question: (s: string) => `Comment valider sa ma├«trise de "${s}" ?`,
    options: ['R├®ussir un quiz ou un projet pratique', 'Regarder un tutorial une fois', 'Avoir suivi un cours sans pratiquer'],
    answer: 0,
  },
  {
    question: (s: string) => `Quelle erreur est fr├®quente quand on d├®bute "${s}" ?`,
    options: ['Pratiquer trop peu', 'Prendre des notes', 'Poser des questions'],
    answer: 0,
  },
  {
    question: (s: string) => `Quelle ressource est la plus adapt├®e pour "${s}" ?`,
    options: ['Un cours structur├® avec exercices', 'Un seul article Wikip├®dia', 'N\'importe quelle vid├®o YouTube'],
    answer: 0,
  },
  {
    question: (s: string) => `Quel rythme d'apprentissage est recommand├® pour "${s}" ?`,
    options: ['Progresser par petites ├®tapes r├®guli├¿res', 'Tout apprendre en un jour', '├ëtudier une fois par mois'],
    answer: 0,
  },
  {
    question: (s: string) => `Avant d'attaquer "${s}", il est pr├®f├®rable de :`,
    options: ['Avoir les pr├®requis n├®cessaires', 'Avoir 5 ans d\'exp├®rience', 'Ne rien pr├®parer du tout'],
    answer: 0,
  },
  {
    question: (s: string) => `Quelle approche fonctionne le mieux pour "${s}" ?`,
    options: ['Th├®orie puis pratique imm├®diate', 'Th├®orie seulement', 'Pratique sans aucune th├®orie'],
    answer: 0,
  },
  {
    question: (s: string) => `Pour "${s}", quel est le pi├¿ge ├á ├®viter ?`,
    options: ['Vouloir tout ma├«triser trop vite', 'Prendre son temps', 'Revoir les bases'],
    answer: 0,
  },
];

function hashSkillName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildFallbackCourse(skillName: string): CourseContent {
  const seed = hashSkillName(skillName);
  const q1 = QUESTION_POOL[seed % QUESTION_POOL.length];
  const q2 = QUESTION_POOL[(seed + 7) % QUESTION_POOL.length];

  return {
    course: {
      introduction: `${skillName} est une ├®tape importante de votre parcours. Ce mini-cours r├®sume les concepts essentiels ├á conna├«tre avant de passer au quiz.`,
      keyPoints: [
        `Comprendre les fondamentaux de ${skillName}`,
        'Pratiquer r├®guli├¿rement avec des exercices courts',
        'Consolider vos acquis avant de passer ├á la comp├®tence suivante',
      ],
      youtubeSearchTerms: [`${skillName} cours d├®butant`, `${skillName} tutorial fran├ºais`],
    },
    quiz: [
      {
        question: q1.question(skillName),
        options: q1.options,
        correctIndex: q1.answer,
      },
      {
        question: q2.question(skillName),
        options: q2.options,
        correctIndex: q2.answer,
      },
    ],
    isFallback: true,
  };
}

export const generateCourseAndQuiz = async (skillName: string): Promise<CourseContent> => {
  const key = cacheKeyCourse(skillName);
  const cached = cacheGet<CourseContent>(key);
  if (cached) return cached;

  try {
    const result = await callGemini(
      COURSE_SYSTEM_PROMPT,
      `La comp├®tence ├á enseigner est : ${skillName}`
    );
    const content: CourseContent = { ...result, isFallback: false };
    cacheSet(key, content, 600_000);
    return content;
  } catch (error) {
    console.error('Erreur lors de la g├®n├®ration du cours avec Gemini:', error);

    const message = error instanceof Error ? error.message : '';
    if (message.includes('Cl├® API manquante') || message.includes('Cl├® API Gemini refus├®e')) {
      throw error;
    }

    const fallback = buildFallbackCourse(skillName);

    if (error instanceof QuotaError) {
      fallback.fallbackReason = `Limite de l'API Gemini atteinte. R├®essaye automatique dans ${error.retryAfterSeconds} seconde${error.retryAfterSeconds > 1 ? 's' : ''}. Contenu de d├®monstration affich├®.`;
      fallback.retryAfterSeconds = error.retryAfterSeconds;
      scheduleRetry(key, skillName, error.retryAfterSeconds);
    } else if (message.includes('quota') || message.includes('429') || message.includes('Quota exceeded') || message.includes('rate_limit') || message.includes('Resource has been exhausted')) {
      const retrySeconds = parseRetryAfter(message);
      fallback.fallbackReason = `Limite de l'API Gemini atteinte. R├®essaye automatique dans ${retrySeconds} seconde${retrySeconds > 1 ? 's' : ''}. Contenu de d├®monstration affich├®.`;
      fallback.retryAfterSeconds = retrySeconds;
      scheduleRetry(key, skillName, retrySeconds);
    } else {
      fallback.fallbackReason = 'L\'IA est temporairement indisponible. Contenu de d├®monstration affich├®.';
    }

    return fallback;
  }
};

function scheduleRetry(cacheKey: string, skillName: string, delaySeconds: number): void {
  setTimeout(async () => {
    try {
      const result = await callGemini(
        COURSE_SYSTEM_PROMPT,
        `La comp├®tence ├á enseigner est : ${skillName}`
      );
      const content: CourseContent = { ...result, isFallback: false };
      cacheSet(cacheKey, content, 600_000);
      console.log(`[Cache] Contenu IA mis en cache pour "${skillName}" apr├¿s lev├®e du quota`);
    } catch {
      // Silently ignore retry failure
    }
  }, (delaySeconds + 2) * 1000);
}
