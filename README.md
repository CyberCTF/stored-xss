# Law Firm XSS Stored Vulnerability Lab

## 📁 Structure du Projet

```
stored-xss/
├── 📄 Documentation/          # Documentation du projet
│   ├── README.md             # Guide principal
│   ├── WRITEUP.md            # Guide d'exploitation
│   ├── metadata.json         # Métadonnées du lab
│   └── deploy/               # Documentation de déploiement
├── 🔧 Configuration/          # Fichiers de configuration
│   ├── docker-compose.yml    # Configuration Docker
│   ├── Dockerfile            # Image Docker
│   ├── package.json          # Dépendances Node.js
│   └── .gitignore           # Fichiers ignorés
├── 🌐 Application/           # Code source de l'application
│   ├── server.js            # Serveur Express
│   ├── bot.js               # Bot administrateur
│   ├── package.json         # Dépendances de l'application
│   └── public/              # Fichiers statiques
│       ├── index.html       # Page d'accueil
│       ├── contact.html     # Formulaire de contact
│       ├── about.html       # Page À propos
│       ├── admin-login.html # Connexion admin
│       ├── admin-dashboard.html # Tableau de bord
│       ├── internal-data.html # Données internes
│       └── images/          # Images du site
├── 🔄 CI-CD/                # Intégration continue
│   └── .github/workflows/   # GitHub Actions
└── 📝 Notes/                # Notes et fichiers temporaires
    └── done.md              # Notes de développement
```

## 🚀 Démarrage Rapide

### Option 1 : Développement local (Recommandé)
```bash
# Aller dans le dossier Application
cd Application

# Installer les dépendances
npm install

# Démarrer l'application
npm start

# Dans un autre terminal, démarrer le bot administrateur
npm run bot
```

### Option 2 : Docker Compose
```bash
# Démarrer avec Docker Compose
docker-compose -f Configuration/docker-compose.yml up -d

# Accéder à l'application
open http://localhost:3206
```

### Option 3 : Docker direct
```bash
# Construire l'image Docker
cd Application
npm run docker-build

# Lancer le conteneur
npm run docker-run
```

## 🎯 Objectif du Lab

Ce laboratoire simule un cabinet d'avocats avec une vulnérabilité **XSS Stockée (Stored XSS)** dans le formulaire de contact. L'objectif est d'exploiter cette vulnérabilité pour voler la session administrateur et accéder à des données sensibles.

## 📚 Documentation

- **Guide principal** : `Documentation/README.md`
- **Guide d'exploitation** : `Documentation/WRITEUP.md`
- **Métadonnées** : `Documentation/metadata.json`

## 🧪 Tests

```bash
# Lancer les tests d'exploitation (si disponibles)
cd Application
npm test
```

## 🔧 Configuration

Tous les fichiers de configuration sont dans le dossier `Configuration/` :
- `docker-compose.yml` : Configuration Docker
- `Dockerfile` : Image Docker
- `package.json` : Dépendances Node.js

## 🌐 Application

Le code source de l'application se trouve dans `Application/` :
- `server.js` : Serveur Express principal
- `bot.js` : Bot administrateur automatisé
- `public/` : Fichiers statiques (HTML, CSS, JS)

## 📊 Accès

- **Application** : http://localhost:3206
- **Panel Admin** : http://localhost:3206/admin

## 🛑 Arrêt

```bash
# Arrêter avec Docker Compose
docker-compose -f Configuration/docker-compose.yml down

# Ou arrêter l'application locale
# Dans le terminal où l'application tourne : Ctrl+C
# Dans le terminal où le bot tourne : Ctrl+C
```

## 📝 Notes

- **Développement** : Les notes de développement sont dans `Notes/`
- **Application** : Le code source principal est dans `Application/`
- **CI/CD** : Les workflows GitHub Actions sont dans `CI-CD/`

---

**⚠️ Ce lab est conçu uniquement à des fins éducatives. Ne pas utiliser en production.** 