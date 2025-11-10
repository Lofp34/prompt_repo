# CROSTAR Prompt Manager

Application web full-stack pour concevoir, organiser et exploiter des prompts structurés selon la méthode **CROSTAR**.

## Architecture

- **Backend** : FastAPI + SQLModel (SQLite par défaut) avec authentification JWT simple.
- **Frontend** : React 18 + Vite + TypeScript, TailwindCSS et React Query.
- **Base de données** : SQLite embarqué (modifiable via `DATABASE_URL`).

## Fonctionnalités principales

- Authentification email/mot de passe (MVP mono-utilisateur).
- Création, édition, duplication et suppression de prompts CROSTAR avec prévisualisation en temps réel.
- Assistant de qualité (rappels, modèles prêts à l'emploi, alerte sur champs essentiels).
- Bibliothèque filtrable (recherche plein texte, tri, filtres par rubrique/sous-rubrique/tag/modèle/langue).
- Gestion des rubriques et sous-rubriques.
- Gestion des tags (via les formulaires de prompts).
- Historique des versions d'un prompt.
- Import/export JSON de l'ensemble de la bibliothèque.

## Prérequis

- Python 3.11+
- Node.js 18+
- npm 9+

## Installation

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\\Scripts\\activate
pip install -r requirements.txt
cp ../.env.example .env  # définir SECRET_KEY et autres variables si besoin
uvicorn app.main:app --reload --port 8000
```

Variables disponibles :

- `SECRET_KEY` (obligatoire) : clé de signature JWT.
- `DATABASE_URL` (optionnel) : URL SQLAlchemy (ex. PostgreSQL).
- `ALLOW_ORIGINS` (optionnel) : liste séparée par virgules des origines autorisées.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # adapter VITE_API_URL si nécessaire
npm run dev
```

L'application est accessible sur `http://localhost:5173`. Le frontend communique avec l'API (`http://localhost:8000/api` par défaut).

## Scripts utiles

- `npm run dev` : démarre l'interface en mode développement.
- `npm run build` : construit la version de production.
- `npm run preview` : prévisualise le build.

## Modèle de données

- `User` : comptes utilisateurs (email, mot de passe hashé).
- `Category` / `Subcategory` : rubriques et sous-rubriques.
- `Tag` : tags libres, reliés aux prompts via `PromptTagLink`.
- `Prompt` : entité principale avec champs CROSTAR, métadonnées et horodatages.
- `PromptVersion` : historique minimal (snapshot JSON + horodatage).

## Import / Export

- **Export** : `GET /api/library/export` renvoie un JSON contenant catégories, sous-rubriques, tags et prompts.
- **Import** : `POST /api/library/import` accepte le même format. Les prompts sont ignorés si un titre identique existe déjà pour l'utilisateur.

## Tests & Qualité

- Validation côté backend via Pydantic + SQLModel.
- Toasts et retours visuels côté frontend pour toutes les actions.

## Pistes d'évolution

- Multi-utilisateurs et partage de bibliothèques.
- Connexion directe à des API LLM pour amélioration automatique.
- Édition collaborative et workflows de validation.
