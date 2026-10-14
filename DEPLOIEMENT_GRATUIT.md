# 🚀 Guide de Déploiement 100% Gratuit pour l'Application Emris

Ce projet a été spécialement configuré pour être déployé **entièrement gratuitement** sans aucun abonnement payant, sur **Netlify** ou **GitHub Pages**, avec persistance directe dans votre table Supabase `utilisateurs`.

---

## 🌟 Option 1 : Déploiement sur Netlify (Recommandé - Le plus simple, 2 minutes)

Netlify offre un hébergement statique haute performance **100% gratuit à vie**, avec certificat SSL HTTPS automatique et nom de domaine gratuit (ex: `emris-app.netlify.app`).

### Méthode A : Déploiement Direct par Glisser-Déposer (Sans ligne de commande)
1. Dans votre projet, exécutez la commande de build :
   ```bash
   npm run build
   ```
2. Un dossier nommé `dist` est généré à la racine de votre projet.
3. Rendez-vous sur [netlify.com](https://www.netlify.com) et connectez-vous gratuitement.
4. Rendez-vous dans l'onglet **Sites** et glissez-déposez le dossier `dist` directement sur la zone de dépôt ("Drag and drop your site output folder here").
5. Votre application est immédiatement en ligne et accessible mondialement !

### Méthode B : Connexion Automatique avec votre GitHub
1. Poussez votre code sur votre compte GitHub.
2. Sur Netlify, cliquez sur **Add new site** > **Import an existing project** > **GitHub**.
3. Sélectionnez votre dépôt Emris.
4. Les paramètres sont déjà automatiquement détectés grâce au fichier `netlify.toml` fourni :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. Cliquez sur **Deploy site**.
6. À chaque fois que vous modifierez votre code sur GitHub, Netlify mettra à jour votre site automatiquement et gratuitement !

---

## 🐙 Option 2 : Déploiement sur GitHub Pages (100% Gratuit)

GitHub Pages héberge votre application gratuitement directement depuis votre compte GitHub.

Le fichier de déploiement automatique `.github/workflows/deploy.yml` a été ajouté au projet.

### Étapes d'activation :
1. Poussez votre code sur GitHub (branche `main` ou `master`).
2. Sur la page de votre dépôt GitHub, cliquez sur **Settings** (Paramètres).
3. Dans le menu de gauche, cliquez sur **Pages**.
4. Sous **Build and deployment** > **Source**, sélectionnez **GitHub Actions**.
5. Allez dans l'onglet **Actions** de votre dépôt : le workflow `Deploy to GitHub Pages` va s'exécuter et publier votre site.
6. L'adresse de votre application sera : `https://<votre-pseudo-github>.github.io/<nom-du-depot>/`.

---

## 🗄️ Table Supabase `utilisateurs`

L'application communique directement depuis le navigateur avec votre projet Supabase (`mjtuheawxnvjxzhxfcgx.supabase.co`).

### Vérifier ou Créer la table dans Supabase :
Si vous ne l'avez pas encore fait dans votre interface Supabase :
1. Connectez-vous sur [supabase.com](https://supabase.com).
2. Ouvrez votre projet `mjtuheawxnvjxzhxfcgx`.
3. Cliquez sur **SQL Editor** dans le menu de gauche.
4. Collez le code SQL suivant et cliquez sur **RUN** :

```sql
CREATE TABLE IF NOT EXISTS public.utilisateurs (
  id TEXT PRIMARY KEY DEFAULT ('usr-' || floor(extract(epoch from now()) * 1000)::text),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT,
  role TEXT DEFAULT 'client',
  account_status TEXT DEFAULT 'pending',
  subscription_plan TEXT DEFAULT 'Essai Gratuit 7 Jours',
  subscription_status TEXT DEFAULT 'trial',
  payment_status TEXT DEFAULT 'none',
  total_paid_fcfa NUMERIC DEFAULT 0,
  device TEXT DEFAULT 'Formulaire Interne Emris',
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation de la sécurité au niveau des lignes
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique
CREATE POLICY IF NOT EXISTS "Lecture publique utilisateurs"
  ON public.utilisateurs FOR SELECT
  USING (true);

-- Autoriser l'insertion directe depuis le formulaire
CREATE POLICY IF NOT EXISTS "Insertion formulaire utilisateurs"
  ON public.utilisateurs FOR INSERT
  WITH CHECK (true);

-- Autoriser la validation par l'administrateur
CREATE POLICY IF NOT EXISTS "Modification utilisateurs"
  ON public.utilisateurs FOR UPDATE
  USING (true);

-- Autoriser la suppression par l'administrateur
CREATE POLICY IF NOT EXISTS "Suppression utilisateurs"
  ON public.utilisateurs FOR DELETE
  USING (true);
```

---

## 📋 Récapitulatif des fichiers inclus pour le déploiement gratuit
- `netlify.toml` : Configuration automatique du build et des redirections SPA pour Netlify.
- `public/_redirects` : Règle de routage SPA pour Netlify (`/* /index.html 200`).
- `public/404.html` : Redirection SPA pour GitHub Pages.
- `public/.nojekyll` : Désactivation du traitement Jekyll pour GitHub Pages.
- `.github/workflows/deploy.yml` : Automatisation GitHub Actions pour GitHub Pages.
- `vite.config.ts` : Configuration avec `base: './'` pour que les styles et scripts fonctionnent partout.
