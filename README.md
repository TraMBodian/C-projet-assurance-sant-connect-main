# Assurance Santé Connect

Plateforme complète de gestion d'assurance santé avec backend Spring Boot et frontend React.

## 🚀 Démarrage Rapide

### Backend + Frontend
```bash
# Installation des dépendances
npm install
cd backend && mvn clean install

# Démarrage (avec H2 par défaut)
cd backend && mvn spring-boot:run
npm run dev
```

### Avec Base de Données Persistante
```bash
# MySQL
mvn spring-boot:run -Dspring-boot.run.profiles=mysql

# PostgreSQL
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

## 🗄️ Configuration Base de Données

L'application supporte 3 bases de données :

| Base de Données | Profil | Persistance | Production |
|---|---|---|---|
| **H2** | `h2` (défaut) | Mémoire | ❌ Non |
| **MySQL** | `mysql` | Disque | ✅ Oui |
| **PostgreSQL** | `postgres` | Disque | ✅ Oui |

### Installation des Bases de Données
```bash
# Script automatique (Windows)
.\setup-database.ps1
```

📖 **Guide complet** : [DATABASE_SETUP.md](DATABASE_SETUP.md)

## 🔐 Comptes Admin
- `bassniang7@yahoo.fr` / `admin1`
- `bodianm372@gmail.com` / `admin1`

## 🛠️ Technologies
- **Backend** : Spring Boot 3.2, Java 21
- **Frontend** : React 18, TypeScript, Vite
- **Base de données** : H2/MySQL/PostgreSQL
- **Sécurité** : JWT, Spring Security
- **UI** : Tailwind CSS, shadcn/ui

## 📱 Fonctionnalités
- ✅ Gestion des assurés
- ✅ Gestion des polices d'assurance
- ✅ Gestion des consultations médicales
- ✅ Système de prescriptions
- ✅ Gestion des sinistres
- ✅ Notifications par email
- ✅ Interface responsive

## 📞 Contact
- Téléphone : +221 77 527 97 27
- Email : bassniang7@yahoo.fr
"# papsa" 
