# 💼 TerangaBiz — Guide de Déploiement Complet

> Application de gestion de business multi-secteurs pour entrepreneurs sénégalais

---

## 📋 Table des matières

1. [Configuration Supabase](#1-configuration-supabase)
2. [Installation locale](#2-installation-locale)
3. [Déploiement Vercel](#3-déploiement-vercel)
4. [Compte Admin](#4-compte-admin)
5. [Structure du projet](#5-structure)

---

## 1. Configuration Supabase

### 1.1 Créer le projet
1. Va sur [supabase.com](https://supabase.com) → **New Project**
2. Nom : `terangabiz` | Région : choisir la plus proche (EU West)
3. Attends que le projet soit prêt (~2 min)

### 1.2 Créer les tables (SQL)
1. Dans Supabase → **SQL Editor** → **New Query**
2. Copie-colle tout le contenu de `supabase-schema.sql`
3. Clique **Run** — toutes les tables sont créées avec la sécurité RLS

### 1.3 Récupérer tes clés API
- Va dans **Settings → API**
- Copie :
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 Configuration Email (optionnel mais recommandé)
- **Authentication → Settings**
- Désactive "Confirm email" pour les tests
- Active-le en production

---

## 2. Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env.local
cp .env.example .env.local
# Édite .env.local avec tes vraies clés Supabase

# 3. Lancer le serveur de développement
npm run dev

# 4. Ouvre http://localhost:3000
```

---

## 3. Déploiement Vercel

### 3.1 Préparer le code (GitHub)
```bash
git init
git add .
git commit -m "Initial TerangaBiz"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/terangabiz.git
git push -u origin main
```

### 3.2 Déployer sur Vercel
1. Va sur [vercel.com](https://vercel.com) → **New Project**
2. Importe ton repo GitHub `terangabiz`
3. Framework : **Next.js** (détecté automatiquement)
4. Ajoute les variables d'environnement :
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
   ```
5. Clique **Deploy** → ton app est en ligne !

### 3.3 Domaine personnalisé (optionnel)
- Dans Vercel → **Domains** → Ajouter `terangabiz.sn`

---

## 4. Compte Admin

Après le déploiement :

1. Dans Supabase → **Authentication → Users** → **Add User**
   - Email : `admin@terangabiz.sn`
   - Password : `Admin@TerangaBiz2024!`
   - ✅ Auto Confirm User

2. Dans **SQL Editor**, exécute :
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@terangabiz.sn';
   ```

3. Connecte-toi avec ces identifiants → tu as accès au panel admin

---

## 5. Structure du projet

```
terangabiz/
├── app/
│   ├── auth/page.tsx          # Connexion / Inscription
│   ├── dashboard/page.tsx     # Dashboard principal
│   ├── sales/page.tsx         # Gestion des ventes
│   ├── clients/page.tsx       # Profils clients
│   ├── subscriptions/page.tsx # Abonnements WiFi/IPTV
│   ├── reports/page.tsx       # Rapports & analyses
│   ├── admin/page.tsx         # Panel administrateur
│   ├── globals.css            # Styles globaux
│   └── layout.tsx             # Layout racine
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Wrapper authenticated pages
│   │   └── Sidebar.tsx        # Navigation latérale
│   └── ui/
│       └── Toast.tsx          # Notifications
├── lib/
│   ├── auth-context.tsx       # Context authentification
│   ├── constants.ts           # Secteurs, catégories, utils
│   ├── supabase.ts            # Client Supabase (browser)
│   └── supabase-server.ts     # Client Supabase (server)
├── supabase-schema.sql        # Schéma complet Supabase
├── .env.example               # Template variables d'env
├── .env.local                 # Tes vraies clés (ne pas commiter)
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🔐 Sécurité

- **RLS activé** sur toutes les tables — chaque user ne voit que ses données
- **Triggers** : profil auto-créé à l'inscription
- **Passwords** hashés par Supabase Auth (bcrypt)
- **Sessions** gérées avec cookies httpOnly via `@supabase/ssr`

---

## 🚀 Stack technique

| Technologie | Usage |
|-------------|-------|
| Next.js 14 | Framework React (App Router) |
| Supabase | Base de données + Auth + RLS |
| TypeScript | Typage statique |
| Vercel | Hébergement & CI/CD |

---

## 📞 Support

Pour toute question : **TERANGABIZ-SN** · Made in Sénégal 🇸🇳
