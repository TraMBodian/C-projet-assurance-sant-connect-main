# 📧 Configuration du système de notifications par email

## ✅ Qu'est-ce qui a été créé?

Un système complet de gestion des emails avec :

### 1. **Notifications automatiques**
- ✉️ Email à l'administrateur lors de chaque nouvelle inscription
- ✉️ Email de confirmation à l'utilisateur
- 📊 Statut des inscriptions (pending, active, rejected)

### 2. **Email temporaire**
- Génération automatique d'adresses email temporaires
- Format : `temp_[timestamp]_[random]@assurance-sante-connect.com`
- Stockage dans la base de données
- Permet de remplacer par un vrai email plus tard

### 3. **Gestion des inscriptions**
- Page admin pour approuver/rejeter les inscriptions
- Approche d'audit pour les administrateurs

## 📁 Fichiers créés/modifiés

### Nouveau code
```
supabase/functions/
  └── send-notification-email/
      └── index.ts                          # Fonction d'envoi d'email

src/services/
  └── emailService.ts                        # Service pour gérer les emails

src/pages/
  └── RegistrationManagementPage.tsx         # Page de gérant les inscriptions

supabase/migrations/
  ├── 001_create_user_profiles.sql          # ✏️ Modifié - ajout statut "pending"
  └── 002_create_temp_emails.sql            # Table pour emails temporaires

### Fichiers modifiés
src/context/AuthContext.tsx                  # ✏️ Ajout envoi email lors inscription
src/pages/SignupPage.tsx                    # ✏️ Ajout option email temporaire
src/App.tsx                                 # ✏️ Ajout route /registrations

### Documentation
├── EMAIL_SETUP_GUIDE.md                    # Guide complet de configuration
├── AUTHENTICATION_GUIDE.md                 # Guide d'authentification
├── 
- 
+ # Profil Spring actif : postgres | mysql | h2
+ SPRING_PROFILE=postgres
+ 
+ # Base de données
+ DB_URL=jdbc:postgresql://postgres-db:5432/assurance_sante_db
+ DB_USER=assurance_app
+ DB_PASSWORD=MotDePasseFort2026!
+ 
+ # JWT
+ JWT_SECRET=remplacer_par_une_chaine_base64_de_64_caracteres_minimum
+ JWT_EXPIRATION_MS=86400000
+ 
+ # Email (optionnel en développement)
+ MAIL_USERNAME=
+ MAIL_PASSWORD=.example                            # Variables d'environnement
└── README.md                               # Ce fichier
```

## 🚀 Configuration

### Étape 1 : Obtenir une clé Resend

1. Accédez à https://resend.com
2. Créez un compte gratuit
3. Allez à Settings → API Keys
4. Copiez votre clé API

### Étape 2 : Configurer Supabase Functions

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# À la racine du projet
supabase secrets set RESEND_API_KEY=<votre_clé_api>
supabase secrets set ADMIN_EMAIL=admin@votre-domaine.com

# Déployer la fonction
supabase functions deploy send-notification-email
```

### Étape 3 : Configurer les variables locales

Créez `.env.local` :
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_clé_publique
```

### Étape 4 : Exécuter les migrations

```bash
# Dans le Supabase Dashboard
# 1. Allez à SQL Editor
# 2. Créez une nouvelle query
# 3. Copiez-collez le contenu de :
#    - supabase/migrations/001_create_user_profiles.sql
#    - supabase/migrations/002_create_temp_emails.sql
# 4. Exécutez les deux queries
```

## 📊 Flux d'utilisation

### Pour les utilisateurs

**À l'inscription :**
1. Aller sur `/signup`
2. Choisir son rôle
3. **Option 1** : Entrer son vrai email
   - Recevoir un email de confirmation
4. **Option 2** : Utiliser un email temporaire
   - Cliquer "Email temporaire?"
   - Générer un email temporaire
   - Copier et utiliser pour l'inscription
   - Vérifier son vrai email plus tard dans le profil

### Pour les administrateurs

**Gestion des inscriptions :**
1. Aller sur `/registrations` (ou ajouter à la sidebar)
2. Voir la liste des inscriptions en attente
3. Approuver ou rejeter les utilisateurs
4. Les utilisateurs approuvés reçoivent un email et peuvent se connecter

## 🔄 Architecture

```
Utilisateur remplit formulaire
       ↓
SignUp créé (email verified ou temp email)
       ↓
Profil créé avec status='pending'
       ↓
Fonction Supabase envoie 2 emails :
  1. Admin notifié
  2. Utilisateur confirmé
       ↓
Administrateur approuve/rejette
       ↓
Status passe à 'active' ou 'rejected'
       ↓
Utilisateur peut se connecter (si approuvé)
```

## 🔧 Configuration avancée

### Personnaliser les emails

Modifiez les fonctions dans `supabase/functions/send-notification-email/index.ts` :
- `newRegistrationEmail()` - Email pour l'admin
- `confirmationEmail()` - Email de confirmation utilisateur

### Ajouter d'autres types d'emails

Dans `emailService.ts`, ajouter une nouvelle fonction :
```typescript
async notifyEvent(params: EventParams) {
  return this.sendNotification({
    type: "event_notification",
    data: params,
  });
}
```

### Intégrer une autre service email

Remplacer Resend par :
- **SendGrid** : `@sendgrid/mail`
- **Mailgun** : `mailgun.com`
- **Nodemailer** : `nodemailer`

## ❓ Dépannage

### Les emails ne s'envoient pas

```bash
# 1. Vérifier les secrets
supabase secrets list

# 2. Voir les logs
supabase functions logs send-notification-email

# 3. Tester manuellement
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/send-notification-email' \
  --header 'Authorization: Bearer your_token' \
  --header 'Content-Type: application/json' \
  --data '{
    "type":"new_registration",
    "data":{
      "email":"test@example.com",
      "fullName":"Test User",
      "role":"admin"
    }
  }'
```

### Email temporaire ne fonctionne pas

1. Vérifier que la table `temp_emails` existe
2. Vérifier les RLS policies
3. Vérifier dans les logs du navigateur (F12 → Console)

### Utilisateur n'accède pas à la page d'inscriptions

- S'assurer que l'utilisateur a le rôle `admin`
- Vérifier que la route est correctement ajoutée dans `App.tsx`
- Ajouter à la sidebar si besoin

## 📋 TODO

- [ ] Configurer Resend API
- [ ] Déployer la fonction Supabase
- [ ] Exécuter les migrations
- [ ] Tester l'inscription
- [ ] Tester l'email temporaire
- [ ] Tester la page admin
- [ ] Ajouter la page /registrations à la sidebar
- [ ] Configurer les emails de réinitialisation de mot de passe
- [ ] Ajouter l'authentification 2FA

## 📞 Support

Pour plus d'aide :
- Voir `EMAIL_SETUP_GUIDE.md` pour les détails
- Voir `AUTHENTICATION_GUIDE.md` pour l'authentification
- Consulter les logs Supabase

## 🎉 Résumé

Vous avez maintenant un système d'authentification complet avec :
- ✅ Inscription/Connexion avec 3 rôles
- ✅ Notifications par email automatiques
- ✅ Email temporaire pour la confidentialité
- ✅ Page de gestion des inscriptions pour l'admin
- ✅ Statut des utilisateurs (pending/active/rejected)
- ✅ Base de données sécurisée avec RLS

Bon développement! 🚀
