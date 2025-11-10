import { PromptFormValues } from "../types";

const SECTION_LABELS: Record<string, string> = {
  contexte: "Contexte",
  role: "Rôle",
  objectif: "Objectif",
  style: "Style",
  ton: "Ton",
  audience: "Audience",
  resultat: "Résultat attendu",
};

export const formatPromptPreview = (values: Partial<PromptFormValues>) => {
  const sections = Object.entries(SECTION_LABELS)
    .map(([key, label]) => {
      const content = values[key as keyof PromptFormValues];
      if (!content) return null;
      return `### ${label}\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `# ${values.title ?? "Sans titre"}\n\n${values.description ? `## Description\n${values.description}\n\n` : ""}${sections}`.trim();
};

export const CROSTAR_HINTS: Record<string, string> = {
  contexte:
    "Décrivez le contexte global : situation, contraintes, informations préalables à connaître.",
  role: "Précisez le rôle attendu de l'IA (coach, analyste, expert, etc.).",
  objectif: "Indiquez l'objectif principal de la réponse, ce que vous souhaitez obtenir.",
  style: "Définissez les préférences stylistiques (formel, concis, narratif, etc.).",
  ton: "Quel ton adopter ? Enthousiaste, sérieux, pédagogique...",
  audience: "Qui lira ou utilisera le résultat ? Décrivez l'audience cible.",
  resultat: "Décrivez le format et les critères de réussite du résultat attendu.",
};

export const PROMPT_TEMPLATES = [
  {
    label: "Analyse de texte",
    values: {
      title: "Analyse structurée d'un texte",
      description:
        "Utilisez cette structure pour analyser un texte selon le cadre CROSTAR et fournir des insights détaillés.",
      contexte:
        "Tu reçois un texte issu d'un rapport d'entreprise décrivant les performances du dernier trimestre.",
      role: "Tu es un analyste d'intelligence économique avec une forte expertise en stratégie.",
      objectif:
        "Identifier les signaux faibles, opportunités et risques contenus dans le texte fourni.",
      style:
        "Structure ton analyse en sections claires, avec titres et bullet points pour chaque partie.",
      ton: "Professionnel, factuel et synthétique.",
      audience:
        "Direction générale et comité de pilotage stratégique qui disposeront de peu de temps pour lire l'analyse.",
      resultat:
        "Une synthèse en trois parties : 1) tendances clés, 2) risques, 3) recommandations concrètes.",
      modele_cible: "GPT-5",
      langue: "fr",
      tags: ["analyse", "stratégie"],
    },
  },
  {
    label: "Génération de script vidéo",
    values: {
      title: "Script vidéo marketing",
      description:
        "Structure de prompt pour générer un script vidéo convaincant en format court.",
      contexte:
        "Tu dois créer un script pour une vidéo de 90 secondes présentant un nouveau produit SaaS pour PME.",
      role: "Tu es un copywriter expert en storytelling vidéo.",
      objectif:
        "Produire un script découpé en scènes avec dialogues et indications visuelles.",
      style:
        "Narration dynamique, phrases courtes, impact émotionnel fort.",
      ton: "Énergique, inspirant et orienté vers l'action.",
      audience:
        "Dirigeants de PME technophiles à la recherche de solutions digitales innovantes.",
      resultat:
        "Un script structuré en 4 parties : accroche, problème, solution, call-to-action.",
      modele_cible: "Claude",
      langue: "fr",
      tags: ["marketing", "video"],
    },
  },
  {
    label: "Analyse d'entretien de vente",
    values: {
      title: "Analyse d'entretien commercial",
      description:
        "Prompt pour débriefer un entretien de vente et identifier les axes d'amélioration.",
      contexte:
        "Tu disposes de la transcription d'un entretien de vente B2B dans le secteur SaaS.",
      role: "Tu es un coach commercial senior spécialisé en ventes complexes.",
      objectif:
        "Dresser le bilan de l'entretien, identifier les signaux d'achat et proposer un plan d'action.",
      style: "Analyse structurée avec sections numérotées.",
      ton: "Constructif, orienté amélioration continue.",
      audience: "L'équipe commerciale et le manager de compte.",
      resultat:
        "Un rapport en trois parties : Résumé, Points forts/Faiblesses, Recommandations actionnables.",
      modele_cible: "GPT-4",
      langue: "fr",
      tags: ["vente", "analyse"],
    },
  },
  {
    label: "Plan de formation",
    values: {
      title: "Création de plan de formation",
      description:
        "Prompt pour concevoir un plan de formation complet et progressif.",
      contexte:
        "Tu dois élaborer un plan de formation sur 6 semaines pour former des chefs de projet à l'agilité.",
      role: "Tu es un formateur expert en pédagogie active.",
      objectif:
        "Construire un plan détaillé avec objectifs pédagogiques, activités et livrables.",
      style: "Tableau ou liste structurée par semaine.",
      ton: "Engageant, motivant mais réaliste.",
      audience: "Chefs de projet expérimentés dans les organisations publiques.",
      resultat:
        "Un plan avec objectifs, contenus, modalités d'animation et évaluations pour chaque module.",
      modele_cible: "Mistral Large",
      langue: "fr",
      tags: ["formation", "pédagogie"],
    },
  },
];
