# Paulownia App

Application web (PWA) de suivi d'un champ de paulownias, construite avec Vite et React.
Elle fonctionne sur téléphone, y compris hors-ligne.

## Fonctionnalités

- **Champ** : carte des arbres sur une grille (cases LxCy). Ouverture ajustée à la largeur de l'écran,
  zoom par pincement ou double-toucher, recherche d'une case (« Aller à… L19C7 »),
  vue d'ensemble en points de couleur quand on dézoome.
- **Arbres** : ajout ou déplacement en saisissant une case (ex. L19C9), avec contrôle des places
  déjà occupées. Fiche par arbre : hauteur, diamètre, santé, herbe au pied, notes, historique.
- **Liste** : tous les arbres, triables et filtrables.
- **Journal** : entrées classées en dossiers par catégorie, du plus récent au plus ancien.
  Photos jointes : vignettes à côté du texte, affichage en grand au toucher.
- **Météo** : relevés de précipitations (température moyenne, pluie...) et d'arrosage (litres par arbre,
  convertis en mm : 1 L sur 1 m² = 1 mm). Récapitulatif mois par mois de l'année choisie,
  pluie en bleu et arrosage en vert sur la même barre.
- **Réglages** : connexion au cloud, export/import JSON, export CSV, renumérotation des arbres
  d'après leur position.

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

## Déploiement

Chaque push sur `main` lance le workflow `.github/workflows/deploy.yml`, qui construit l'app
et la publie sur GitHub Pages : https://blayadrien.github.io/PaulowniaApp/

GitHub Pages garde la page en cache jusqu'à 10 minutes : une nouvelle version peut mettre
ce temps à apparaître sur le téléphone. Vérifier que le build passe avant de pousser :

```bash
npm run build
```

## Installation sur téléphone

- iOS : Safari, bouton Partager, « Sur l'écran d'accueil »
- Android : Chrome, menu, « Ajouter à l'écran d'accueil »

## Données et sauvegarde

Les données sont gardées sur le téléphone (`localStorage`, clé `arbre-v7`) et synchronisées
dans Firebase Firestore une fois connecté avec Google (Réglages). Sans connexion réseau,
les modifications sont envoyées au retour du réseau.
L'export JSON (Réglages) reste conseillé de temps en temps comme copie de secours.

## Structure du projet

```
src/
├── main.jsx               Point d'entrée
├── App.jsx                Composant racine, navigation et fenêtres
├── firebase.config.js     Configuration du projet Firebase
├── styles/global.css      Styles
├── hooks/
│   ├── useData.js         Données (arbres, journal, météo) et synchronisation
│   └── useToast.js        Notifications
├── utils/
│   ├── constants.js       Santé, herbe, constantes d'affichage
│   ├── helpers.js         Dates, numérotation, calcul de la grille
│   ├── storage.js         Stockage local
│   ├── cloud.js           Connexion Google, Firestore et photos
│   ├── image.js           Réduction des photos avant envoi
│   └── canvas.js          Dessin de la carte
└── components/
    ├── PageChamp.jsx      Carte du champ
    ├── PageListe.jsx      Liste des arbres
    ├── PageJournal.jsx    Journal par catégories
    ├── PageMeteo.jsx      Météo et récapitulatif mensuel
    ├── TreeSheet.jsx      Fiche d'un arbre
    ├── PlaceSheet.jsx     Ajout / déplacement par case
    ├── Photos.jsx         Vignettes et affichage plein écran
    ├── GridSheet.jsx      Création d'une grille
    ├── ConfirmSheet.jsx   Confirmation de placement de grille
    ├── JournalSheet.jsx   Formulaire du journal
    ├── MeteoSheet.jsx     Formulaire météo
    ├── SettingsSheet.jsx  Réglages
    ├── Sheet.jsx          Fenêtre du bas générique
    ├── GrassIcon.jsx      Icône herbe au pied
    └── Toast.jsx          Notification temporaire
```
