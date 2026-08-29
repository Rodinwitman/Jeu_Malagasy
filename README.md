# Teny Malagasy — Plateforme de jeux de mots

## État actuel : Phase 1 livrée

Conformément à l'ordre de priorité du cahier des charges (§25), voici ce qui
est **fonctionnel maintenant** :

- ✅ Structure complète du projet (frontend/backend/data), telle que définie au §3.
- ✅ Page de connexion/inscription adaptée en malagasy, fidèle au design fourni
  (`frontend/page_connexion/`) : Hiditra / Hisoratra anarana, transition animée,
  champs avec icônes SVG, liaison réelle Google + Facebook.
- ✅ Authentification simulée (localStorage) en attendant le backend.
- ✅ Système de navigation (sidebar responsive → hamburger sur mobile).
- ✅ Dashboard avec stats dynamiques (tout est vide au départ), défi du jour,
  cartes de jeux, fenêtre de règles obligatoire avant de lancer une partie.
- ✅ Mode clair/sombre, persistant, appliqué à tout le site.
- ✅ Design system centralisé (`frontend/css/variables.css`) réutilisable
  partout, cohérent avec la page de connexion fournie.
- ✅ Squelette backend Node.js/Express + schéma SQL de référence.
- ✅ Pages placeholder pour les sections pas encore construites (pour que
  tous les liens du dashboard fonctionnent déjà).

# Teny Malagasy — Plateforme de jeux de mots

## État actuel : Phase 4 livrée

- ✅ Structure complète, page de connexion, dashboard, navigation, mode
  clair/sombre — voir les phases précédentes ci-dessous.
- ✅ **Mot Nafenina, Devinette, Scrabble** entièrement fonctionnels.
- ✅ **Backend Node.js + Express + SQLite** réellement fonctionnel et testé.
- ✅ **Frontend branché sur le backend**, avec repli local automatique.
- ✅ **Défi quotidien repensé** : mélange des 3 jeux, progression depuis
  le niveau 1.
- ✅ **Anti-répétition des mots/questions** par joueur et par jeu.
- ✅ **Correctif du bug des étoiles** bloquées à 2.
- ✅ Classement, Avis, Défis, Paramètres, page Règles.
- ✅ Pendu et Wordle : pages "Ho avy tsy ho ela" dédiées.

## Connexion frontend ↔ backend (nouveau)

Le site fonctionne **toujours**, avec ou sans backend démarré :
- Au chargement de chaque page, `frontend/js/api.js` fait un health-check
  rapide (1,2s max) vers `http://localhost:4000/api/health`.
- **Si le backend répond** : inscription/connexion, scores, classement,
  avis et défi quotidien passent par la vraie API (données partagées
  entre appareils, persistées en SQLite).
- **Si le backend ne répond pas** (non démarré, ou coupé en cours de
  route) : tout continue de fonctionner exactement comme avant, avec
  `localStorage` (voir `frontend/js/storage.js`).
- Un utilisateur inscrit via l'API est automatiquement "reflété" dans le
  stockage local avec le **même identifiant**, pour que le reste de
  l'interface (profil, XP, historique) continue de fonctionner sans
  changement.

Pour utiliser le vrai backend : voir `backend/README` plus bas
("Démarrer le backend"). Par défaut le frontend cherche l'API sur
`http://localhost:4000/api` — modifiable via `localStorage.setItem('tm_api_base', '...')`
ou directement dans `frontend/js/api.js`.

## Défi quotidien — repensé

Deux changements importants :

1. **Progression depuis le niveau 1.** Avant, le défi était toujours
   dans la zone "Sarotra" (niveau 240+), ce qui le rendait injouable dès
   le premier jour. Maintenant, une date de référence fixe (16 août
   2026 = niveau 1) sert de point de départ : le niveau grimpe de 1
   chaque jour, et boucle après 300. Aujourd'hui = niveau 1, demain =
   niveau 2, etc. La date de référence est définie à la fois dans
   `frontend/js/utils.js` et `backend/controllers/challengeController.js`
   (`EPOCH`) — à ne changer que d'un seul côté à la fois si tu veux
   décaler le calendrier.
2. **Mélange des 3 jeux.** Le défi du jour n'est plus un seul jeu tiré
   au hasard : il faut réussir **Mot Nafenina, Devinette et Scrabble**,
   tous au même niveau du jour, pour obtenir un bonus (+100 points,
   +50 XP). Chaque jeu réussi seul rapporte quand même ses points
   normaux ; le bonus ne s'ajoute qu'une fois les 3 validés (et n'est
   jamais redonné deux fois le même jour).

## Anti-répétition des mots/questions

`Utils.pickUnique(gameId, userId, niveau, candidats, getKey)` retient,
par joueur et par jeu (clé localStorage `tm_used_<jeu>_<userId>`), tout
ce qui a déjà été vu. Un mot ou une question déjà rencontré n'est plus
proposé tant qu'il reste des éléments inédits dans la banque de contenu
correspondant à la difficulté du niveau ; une fois tout le stock épuisé,
le cycle recommence proprement plutôt que de planter.

**Limite honnête à connaître** : la banque de contenu actuelle a été
élargie (~60 mots pour Mot Nafenina, ~48 mots pour Scrabble, 24
questions pour Devinette) mais reste un jeu de démarrage, pas un
dictionnaire exhaustif. Avec 300 niveaux à couvrir, le cycle se
répètera avant d'avoir vu 300 mots différents. Pour une V2, il faudrait
un vrai travail lexicographique (idéalement avec un locuteur natif ou
une base terminologique malagasy) pour atteindre plusieurs centaines
d'entrées uniques par jeu et par difficulté.

## Correctif : étoiles bloquées à 2

Le calcul des étoiles reposait sur une combinaison de "temps restant"
ET "aucun indice utilisé", ce qui rendait 3 étoiles quasiment
impossible à obtenir sur les niveaux difficiles (temps très court par
design). Le calcul est maintenant basé **uniquement sur les indices
utilisés** (et les erreurs pour Devinette) : une réponse juste sans
aucune aide donne toujours 3 étoiles, peu importe le temps mis pour
répondre. Ce changement s'applique aux 3 jeux.

## Système de difficulté — refonte à 6 paliers (nouveau)

Le système de niveaux (`Utils.getLevelConfig` côté frontend,
`levelService.js` côté backend — **vérifié identiques sur les 300
niveaux**) est maintenant organisé en 6 paliers explicites :

| Niveaux | Palier | Sélection des mots |
|---|---|---|
| 1-50 | Tena mora | 3-4 lettres, vocabulaire moderne |
| 51-100 | Mora | 5-7 lettres, vocabulaire moderne |
| 101-150 | Antonony | 8-9 lettres, vocabulaire moderne |
| 151-200 | Antonony sarotra | 8-9 lettres, vocabulaire moderne (même longueur qu'Antonony, mais moins de temps/indices) |
| 201-250 | Sarotra | Mots **anciens** mais encore utilisés (ombiasa, hasina, vintana, andriana...) |
| 251-300 | Tena sarotra | Mots **archaïques**, presque oubliés (andevo, tsimandoa, fanompoana...) |

### Algorithme anti-répétition (`Utils.pickNoRepeat` / `pickWordNoRepeat`)
Boucle explicite : on essaie les candidats un par un (ordre mélangé
selon le niveau) et on vérifie si chacun a déjà été utilisé par CE
joueur dans CE jeu. S'il l'a été, on passe au suivant ; sinon on le
garde. Testé sur les 300 niveaux d'affilée : **aucune répétition à
moins de 3 niveaux d'écart**, et le stock d'un palier épuisé se
recycle sans jamais effacer l'historique des autres paliers (bug
corrigé en cours de route — voir le code pour le détail du
"cooldown").

### Dictionnaire malagasy en ligne (filet de sécurité)
Comme demandé, une tentative d'enrichissement via un dictionnaire
malagasy en ligne (Wiktionnaire, catégorie "malgache") a été ajoutée
comme **dernier recours** quand le stock local est épuisé
(`Utils.fetchWiktionaryWord`, uniquement pour Mot Nafenina et
Scrabble). **Important à savoir** : je n'ai trouvé aucune API dédiée
de dictionnaire malagasy fiable, et je n'ai pas pu tester cet appel en
conditions réelles dans cet environnement de développement (accès
réseau restreint à quelques domaines, `wiktionary.org` non inclus). Le
code est écrit défensivement (délai court, échec silencieux, jamais
bloquant pour le jeu), mais à valider une fois déployé avec un accès
internet complet — notamment le nom exact de la catégorie Wiktionary à
cibler, qui pourrait nécessiter un ajustement.

### Taille des banques de mots (après enrichissement)

| Jeu | Taille | Répartition |
|---|---|---|
| Mot Nafenina | **198 mots** | 26 (3-4 l.) / 52 (5-7 l.) / 53 (8-9 l.) / 30 ancien / 13 archaïque |
| Scrabble | **176 mots** | 24 (3-4 l.) / 52 (5-7 l.) / 51 (8-9 l.) / 26 ancien / 9 archaïque |
| Devinette | **96 questions** | 16 par palier (× 6 paliers) |

Testé sur les 300 niveaux d'affilée après cet enrichissement :
- Mot Nafenina : écart moyen entre deux réutilisations d'un même mot = **31 niveaux** (contre 19 avant, 10 à la version initiale)
- Scrabble : écart moyen = **29 niveaux** (contre 16 avant)
- Devinette : écart moyen = **15 niveaux** (contre 11 avant)

Toujours pas de répétition à moins de 3 niveaux d'écart sur aucun des 3 jeux (le "cooldown" empêche un mot de revenir juste après avoir servi).

**Limite honnête toujours valable** : ce n'est toujours pas assez pour zéro répétition absolue sur 300 niveaux — il faudrait plusieurs centaines de mots par catégorie pour ça. Le vocabulaire "ancien"/"archaïque" en particulier reste ma meilleure tentative de reconstitution, non vérifiée par un linguiste malagasy natif.



1. Construire réellement Pendu et Wordle (actuellement pages d'attente).
2. Authentification par JWT rafraîchi/persisté proprement (actuellement
   le token est stocké en clair dans localStorage, sans renouvellement).
3. Déploiement (choisir un hébergeur pour le backend + la base SQLite ou
   migrer vers PostgreSQL managé).
4. Étoffer la banque de mots/questions pour réduire la fréquence de
   recyclage du contenu (voir limite honnête ci-dessus).

## Séparation totale Défi / Progression normale (nouveau)

Deux problèmes signalés, corrigés ensemble :

### 1. Enchaînement automatique des jeux du défi
Avant, finir le défi dans Mot Nafenina continuait la progression normale
de Mot Nafenina au lieu d'enchaîner sur Devinette. Maintenant :
**Mot Nafenina → Devinette → Scrabble → retour à l'accueil.**
Le bouton "Manaraka" du résultat change de comportement et de libellé
automatiquement en mode défi (`Utils.getNextDefiUrl` calcule le jeu
suivant, ou renvoie vers le dashboard si c'est le dernier).

### 2. Le défi ne "se raccorde" plus jamais à la progression générale
Vérifié de bout en bout (frontend ET backend) :
- **XP / points du profil général** : jamais modifiés par le défi (ni
  score individuel, ni bonus des 3 jeux). Stockés à part dans
  `Storage.getChallengeStats()` côté frontend et la table
  `defis_stats` côté backend (jamais dans `profils_joueur`).
- **Classement général / par jeu** : le défi n'appelle plus
  `Storage.addScore` ni `Api.addScore` — un défi complet n'apparaît
  jamais dans le classement normal.
- **Niveau sauvegardé du jeu** (`tm_progress_<jeu>_<userId>`) : jamais
  avancé par le défi, puisque `saveLevel()` n'est appelé qu'en mode
  normal.
- **Banque de mots/questions** : chaque jeu a maintenant une banque
  **dédiée** au défi (`DEFI_WORD_BANK` / `DEFI_QUESTION_BANK`,
  volontairement petite et séparée de la banque principale), choisie de
  façon déterministe (`Utils.pickWordForChallenge` /
  `pickQuestionForChallenge`, sans toucher à la mémoire anti-répétition
  du mode normal).

Testé explicitement : compléter les 3 jeux du défi laisse le profil
général à `xp:0, pointsTotal:0`, le classement vide, et le niveau
sauvegardé de chaque jeu intact — seules les stats de défi séparées
évoluent.

## Faire fonctionner Google et Facebook pour de vrai (nouveau)

Le code est **prêt et correct des deux côtés** (frontend + backend), mais
je ne peux pas créer de vrais identifiants OAuth à ta place — ça
nécessite tes propres comptes développeur Google et Facebook, liés à
ton propre projet/app. Voici les étapes **exactes et à jour** (l'interface
Google a été réorganisée en 2025-2026 en "Google Auth Platform").

### Google — obtenir un Client ID
1. Va sur https://console.cloud.google.com et crée (ou choisis) un projet.
2. Dans le menu, ouvre **Google Auth Platform** (nouvelle interface qui a
   remplacé l'ancien écran "OAuth consent screen").
3. Onglet **Branding** : renseigne le nom de l'app et un email de support,
   sauvegarde.
4. Onglet **Audience** : choisis **External** (pas *Internal* — impossible
   à changer après coup sans recréer un projet). L'app démarre en mode
   *Testing* : seuls les comptes ajoutés dans "Test users" (jusqu'à 100)
   peuvent se connecter tant que tu n'as pas publié l'app.
5. Onglet **Data Access** : ajoute les scopes `openid`, `email`, `profile`
   — ce sont des scopes non-sensibles, publiables sans vérification Google.
6. Onglet **Clients** → **Create Client** → type **Web application**.
7. Dans **Authorized JavaScript origins**, ajoute exactement l'origine que
   tu utilises pour tester, par exemple `http://localhost:3000` (le port
   compte). Sans ça, Google refuse silencieusement la connexion.
8. Clique **Create** : le **Client ID** apparaît (format
   `xxxxx.apps.googleusercontent.com`).
9. Colle-le dans `frontend/js/auth.js`, en haut du fichier :
   ```js
   const AUTH_CONFIG = {
       GOOGLE_CLIENT_ID: 'TON_CLIENT_ID.apps.googleusercontent.com',
       ...
   };
   ```
10. Dans `backend/.env`, renseigne aussi `GOOGLE_CLIENT_ID=...` (même
    valeur) — c'est ce qui permet au backend de vérifier le jeton
    réellement (voir `backend/controllers/authController.js`).

### Facebook — obtenir un App ID
1. Va sur https://developers.facebook.com/ et connecte-toi.
2. **My Apps** → **Create App**.
3. Choisis le cas d'usage **"Authenticate and request data from users
   with Facebook Login"** (ou équivalent "Consumer"/"None" selon la
   version de l'interface), type **Web**.
4. Renseigne le nom de l'app et l'email de contact, valide.
5. Va dans **Facebook Login → Settings** : ajoute ton URL dans **Valid
   OAuth Redirect URIs** (par exemple `http://localhost:3000/`).
6. Va dans **App Settings → Basic** : ajoute au moins un **App Domain**
   (ex: `localhost`), et copie l'**App ID** affiché ici.
7. Tant que l'app n'est pas publiée ("Live"), seuls les comptes ayant un
   rôle sur l'app (Admin/Développeur/Testeur, ajoutés dans **Roles**)
   peuvent se connecter — ajoute ton propre compte Facebook en testeur.
8. Colle l'App ID dans `frontend/js/auth.js` :
   ```js
   const AUTH_CONFIG = {
       ...
       FACEBOOK_APP_ID: 'TON_APP_ID'
   };
   ```
9. Dans `backend/.env`, renseigne aussi `FACEBOOK_APP_ID` /
   `FACEBOOK_APP_SECRET` si tu veux que le backend vérifie le jeton côté
   serveur (recommandé, voir `backend/controllers/authController.js`).

### Points de vigilance (sources fréquentes d'échec silencieux)
- **L'origine doit correspondre EXACTEMENT** (protocole + hôte + port).
  `http://localhost:3000` ≠ `http://127.0.0.1:3000` pour Google.
- Tant que l'app Google/Facebook n'est pas publiée, **seuls les comptes
  que tu as explicitement ajoutés** (testeurs) peuvent se connecter —
  ce n'est pas un bug si ton propre compte de test fonctionne mais pas
  un autre compte au hasard.
- J'ai mis à jour la version de l'API Graph Facebook utilisée dans le
  code (`v21.0`, au lieu de l'ancienne `v19.0`) — vérifie sur
  https://developers.facebook.com/docs/graph-api/changelog/ si une
  version plus récente est recommandée au moment où tu déploies.
- Si le bouton ne fait rien du tout : ouvre les DevTools (F12) →
  Console, l'erreur exacte de Google/Facebook s'affiche généralement
  là (ex: "The given origin is not allowed for the given client ID").

## Le backend, en détail

### Pourquoi SQLite plutôt que PostgreSQL/MySQL ?
C'est une vraie base **SQL**, mais elle vit dans un simple fichier —
testable immédiatement sans serveur de base de données séparé. Migrer
vers PostgreSQL plus tard ne demande que de changer
`backend/config/database.js`.

### Démarrer le backend
```bash
cd backend
npm install
cp .env.example .env      # puis éventuellement éditer .env
npm start                  # démarre sur http://localhost:4000
```
La base `backend/data/teny_malagasy.sqlite` est créée automatiquement au
premier démarrage.

### Endpoints testés et fonctionnels
- `POST /api/auth/register`, `POST /api/auth/login` (bcrypt + JWT)
- `POST /api/auth/google`, `POST /api/auth/facebook` (vérifient le jeton
  côté serveur)
- `GET /api/games`, `GET /api/games/:id/niveau/:n`
- `POST /api/scores` (protégé par JWT, avec garde-fou anti-triche)
- `GET /api/leaderboard/global`, `GET /api/leaderboard/:jeu`
- `GET /api/reviews/:jeu`, `POST /api/reviews`
- `GET /api/challenges/today`, `GET /api/challenges/progress`,
  `POST /api/challenges/progress` (mélange des 3 jeux, bonus unique)

Testé de bout en bout via curl : inscription → connexion → score →
progression du défi sur les 3 jeux → bonus attribué une seule fois →
classement mis à jour → avis ajouté et relu.

## Points importants à connaître

### Les "300 niveaux par jeu"
Génération procédurale déterministe, dupliquée à l'identique côté
frontend (`frontend/js/utils.js`) et backend
(`backend/services/levelService.js`) pour empêcher la triche.

### Connexion Google / Facebook
Réelle des deux côtés : le frontend appelle les SDK officiels, le
backend vérifie le jeton. Voir `.env.example` dans `backend/` et le
haut de `frontend/js/auth.js`.

### Données 100% dynamiques
Rien n'est pré-rempli : la base SQLite démarre vide (seuls les 5 jeux
sont importés au démarrage), et le mode local aussi.

### Son par jeu
Aucun contrôle de son dans le dashboard général. Chaque jeu a son
propre bouton son ; Paramètres offre un raccourci pratique.

## Comment visualiser le site actuel
Ouvre `frontend/page_connexion/index.html` dans un navigateur (ou sers
le dossier avec un petit serveur local, ex. `npx serve frontend`).
Pour tester avec le vrai backend, démarre-le en plus (voir plus haut) —
le frontend le détectera automatiquement.

### ⚠️ Piège connu : erreurs 404 sur `connexion.css` / `connexion.js`
Si tu vois dans la console des erreurs du type
`GET http://localhost:3000/connexion.css 404 (Not Found)` (le chemin
n'a PAS `/page_connexion/` dedans), c'est que le serveur local a
répondu à une URL **sans slash final** (`/page_connexion` au lieu de
`/page_connexion/`) sans rediriger — le navigateur résout alors les
chemins relatifs depuis la racine du site, pas depuis le dossier de la
page. Ce n'est pas un bug du code, c'est un comportement de certains
serveurs de fichiers statiques (confirmé : `serve` sans config fait
ça, `python3 -m http.server` ne le fait pas — il redirige nativement).

- Un fichier `frontend/serve.json` est déjà présent dans ce projet
  pour forcer `serve` (le paquet npm) à toujours rediriger
  correctement — vérifié : `serve .` redirige bien `/page_connexion`
  vers `/page_connexion/` (301) grâce à ce fichier.
- Dans tous les cas, navigue toujours en cliquant sur les liens de
  l'application (depuis `frontend/index.html`) plutôt qu'en tapant une
  URL de sous-page à la main sans slash final.



