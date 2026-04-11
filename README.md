# 🌿 Paulownia App

PWA de suivi de champ d'arbres, construite avec **Vite + React**.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

## Déployer sur GitHub Pages

### Option A — Déploiement manuel (simple)
```bash
npm run build
# Copie le contenu de dist/ dans ton repo GitHub Pages
```

### Option B — GitHub Actions (automatique à chaque push)
Ajoute ce fichier dans `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Structure du projet

```
src/
├── main.jsx                 # Point d'entrée React
├── App.jsx                  # Composant racine, orchestration
├── styles/
│   └── global.css           # Tous les styles
├── hooks/
│   ├── useData.js           # State global (arbres, journal, météo)
│   └── useToast.js          # Notifications toast
├── utils/
│   ├── constants.js         # HEALTH_DEFS, GRASS_DEFS, etc.
│   ├── helpers.js           # uid, today, fmt, renumber…
│   ├── storage.js           # localStorage
│   └── canvas.js            # Moteur de rendu canvas
└── components/
    ├── PageChamp.jsx        # Vue carte canvas interactive
    ├── PageListe.jsx        # Liste triable des arbres
    ├── PageJournal.jsx      # Journal de terrain
    ├── PageMeteo.jsx        # Relevés météo
    ├── TreeSheet.jsx        # Formulaire arbre (santé + herbe)
    ├── GridSheet.jsx        # Placement grille automatique
    ├── ConfirmSheet.jsx     # Confirmation placement
    ├── JournalSheet.jsx     # Formulaire entrée journal
    ├── MeteoSheet.jsx       # Formulaire relevé météo
    ├── SettingsSheet.jsx    # Export / import / reset
    ├── Sheet.jsx            # Modal bas générique
    ├── GrassIcon.jsx        # Icône SVG herbe au pied
    └── Toast.jsx            # Notification temporaire
```

## Installation sur téléphone

**iOS** → Safari → bouton Partager → "Sur l'écran d'accueil"  
**Android** → Chrome → ⋮ → "Ajouter à l'écran d'accueil"

## Données

Stockées dans `localStorage` (clé `arbre-v7`). Compatible avec les exports JSON de la version précédente.
