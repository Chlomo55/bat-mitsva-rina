=== Bat Mitsva de Rina ===

Invitation en ligne + formulaire de réponse (RSVP) + espace d'administration.

--- Lancer en local ---

1. npm install
2. npm run dev
3. Ouvrir http://127.0.0.1:4173
4. Admin : http://127.0.0.1:4173/admin.html
   Mot de passe par défaut : 1234

En local, les réponses sont enregistrées dans data/rsvps.json.

--- Déployer sur Netlify ---

Le stockage en production utilise Netlify Blobs (aucune base Supabase requise).

1. npm install
2. npx netlify login
3. npm run deploy
   (crée le site si besoin, pose ADMIN_PASSWORD=1234, déploie en production)

Variables d'environnement optionnelles sur Netlify :
- ADMIN_PASSWORD (défaut côté code : 1234)
