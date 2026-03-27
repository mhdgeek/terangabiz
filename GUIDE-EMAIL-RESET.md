# 📧 Guide — Configuration Email Reset Mot de Passe (Supabase)

## Étape 1 — Configurer l'URL de redirection dans Supabase

1. Va sur [supabase.com](https://supabase.com) → ton projet
2. **Authentication → URL Configuration**
3. Dans **"Redirect URLs"**, ajoute :
   ```
   https://TON-DOMAINE.vercel.app/reset-password
   ```
   Et pour les tests en local :
   ```
   http://localhost:3000/reset-password
   ```
4. Clique **Save**

---

## Étape 2 — Configurer le template d'email

1. **Authentication → Email Templates**
2. Clique sur **"Reset Password"**
3. Tu peux personnaliser le message, exemple :

**Sujet :**
```
Réinitialisation de votre mot de passe TerangaBiz
```

**Corps du message :**
```html
<h2>TerangaBiz — Réinitialisation du mot de passe</h2>
<p>Bonjour,</p>
<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans <strong>1 heure</strong>.</p>
<p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
<br>
<p>L'équipe TerangaBiz 🇸🇳</p>
```

4. Clique **Save**

---

## Étape 3 — Configurer un vrai serveur SMTP (recommandé en production)

Par défaut, Supabase utilise son propre serveur email (limité à 3 emails/heure en mode gratuit).

### Option A — Utiliser Resend (gratuit, 3000 emails/mois)

1. Crée un compte sur [resend.com](https://resend.com)
2. Crée une clé API
3. Dans Supabase → **Project Settings → Auth → SMTP Settings** :
   - **SMTP Host** : `smtp.resend.com`
   - **SMTP Port** : `465`
   - **SMTP User** : `resend`
   - **SMTP Password** : ta clé API Resend
   - **Sender email** : `noreply@tondomaine.com`
   - **Sender name** : `TerangaBiz`

### Option B — Utiliser Gmail SMTP

1. Dans ton compte Gmail → **Sécurité → Mots de passe d'application**
2. Génère un mot de passe pour "Mail"
3. Dans Supabase → **Auth → SMTP Settings** :
   - **SMTP Host** : `smtp.gmail.com`
   - **SMTP Port** : `587`
   - **SMTP User** : `tonmail@gmail.com`
   - **SMTP Password** : le mot de passe d'application généré
   - **Sender email** : `tonmail@gmail.com`

---

## Étape 4 — Désactiver la confirmation d'email (pour les tests)

Pour les tests Vercel (éviter d'avoir à confirmer l'email à chaque inscription) :

1. **Authentication → Settings**
2. Désactive **"Enable email confirmations"**
3. Réactive-le en production !

---

## Comment ça fonctionne dans l'app

### Côté utilisateur (mot de passe oublié) :
1. Il clique **"Mot de passe oublié ?"** sur la page de connexion
2. Il entre son email → reçoit un lien dans sa boîte mail
3. Il clique le lien → il est redirigé vers `/reset-password`
4. Il entre son nouveau mot de passe (avec les règles de sécurité)
5. Mot de passe mis à jour → redirection automatique vers la connexion

### Côté Admin (débloquer un utilisateur bloqué) :
1. Dans le Panel Admin → liste des utilisateurs
2. Clique sur 🔑 à côté de l'utilisateur bloqué
3. Confirme l'email → le lien est envoyé automatiquement
4. L'utilisateur reçoit l'email et peut créer un nouveau mot de passe

---

## Règles des mots de passe (configurées dans l'app)

| Règle | Requis |
|-------|--------|
| Longueur minimum | 8 caractères |
| Lettre majuscule | ✅ |
| Lettre minuscule | ✅ |
| Chiffre | ✅ |
| Caractère spécial (!@#$...) | ✅ |

