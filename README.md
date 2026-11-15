# ✉️ Annonce — enveloppe virtuelle

Une enveloppe à ouvrir sur smartphone. Elle révèle la grossesse aux futurs grands-parents, puis leur laisse une carte souvenir à enregistrer.

Le site est statique : HTML, CSS et JavaScript, sans framework ni étape de build. Seule dépendance d'exécution : la police Cormorant Garamond, hébergée dans le projet. Un contrôle d'accès par prénom, côté serveur, est disponible en option (Vercel).

```
public/                     ← le site (c'est ce dossier qui est déployé)
├── index.html              structure + balises de confidentialité / aperçu neutre
├── config.js               ★ TOUS les textes, la photo, la musique, le rythme
├── css/style.css           direction artistique, enveloppe, carte
├── js/app.js               chorégraphie (Web Animations API) + accessibilité
├── js/souvenir.js          carte souvenir PNG dessinée en Canvas (aucune lib)
├── assets/
│   ├── echographie-placeholder.svg   ← à remplacer
│   └── fonts/              Cormorant Garamond (OFL), auto-hébergée
├── og-image.jpg            aperçu WhatsApp neutre (enveloppe fermée)
└── _headers                en-têtes pour Netlify / Cloudflare Pages
middleware.js               contrôle d'accès optionnel par prénom (Vercel)
acces.config.js             ★ textes de la page d'accès (prénom), FR + tunisien
vercel.json                 en-têtes de sécurité, dossier publié
tools/preview.html          aperçu multi-écrans pour le dev
tools/og-image.html         source de l'image d'aperçu
```

## Lancer en local

```bash
npm run dev            # → http://localhost:4173 (page prénom via .env.local + rechargement auto)
npm run preview        # → http://localhost:4173/tools/preview.html (3 tailles d'écran côte à côte)
```

Utile pour tester :

- `?lang=tn` : version en tunisien (écriture arabe, de droite à gauche).
- Le mode « Réduire les animations » du système (macOS ou iOS) active la version en fondus simples.
- Pour essayer sur votre téléphone, ouvrez `http://IP-DU-MAC:4173` depuis le même Wi-Fi.

## Personnaliser (sans toucher au code)

Tout se fait dans **`public/config.js`** :

| Quoi | Où |
|---|---|
| Textes FR / tunisien | `texts.fr`, `texts.tn` |
| Langue par défaut | `lang: 'fr'` ou `'tn'` (ou `?lang=tn` dans le lien) |
| Sélecteur de langue | `showLanguageSwitch: true`, libellés dans `languageName` |
| Versions par personne | `versions` : `grand-pere`, `grand-mere`, `tante`, `oncle`, `tante-paternelle`, `oncle-paternel`. Choisie par le prénom (`ACCES_PRENOMS = michel:grand-pere`) ou par `?pour=…`. Même déroulement, textes au tutoiement (FR + tunisien), bouton Imprimer |
| Date prévue | `dueDate: 'Arrivée prévue : mai 2027'` (`null` = masquée) |
| Photo | `echo.src`, cadrage avec `echo.position` (ex. `'50% 35%'`) |
| Musique | `music.src: 'assets/musique.mp3'` → un bouton ♪ apparaît (son coupé par défaut) |
| Rythme | `pace: 1.2` pour ralentir l'ensemble |

Les textes de la **page d'accès** (celle qui demande le prénom) sont dans **`acces.config.js`**, à la racine. Cette page s'affiche aussi dans l'aperçu WhatsApp quand le contrôle d'accès est actif, donc ses `title` et `description` doivent rester neutres. Elle suit la langue du lien (`?lang=tn`). Après une modification, redéployez.

Le brouillon tunisien est à relire : je l'ai écrit au mieux, mais vous seule savez comment vous parlez à vos parents.

### Ajouter la vraie échographie

```bash
npm run optimise-echo --src="$HOME/Desktop/echo.jpg"    # macOS : 1400 px, JPEG 82 %, ~200 Ko
```

Ensuite, dans `config.js`, indiquez `echo.src: 'assets/echographie.jpg'`. Floutez ou recadrez le nom et la date de naissance de Salma qui sont imprimés sur le cliché.

## Déployer

### Option A — Vercel (recommandée, permet le contrôle d'accès)

```bash
npm i -g vercel@latest   # votre CLI est en 65.2, la dernière est 65.16
vercel                   # premier déploiement (aperçu)
vercel --prod            # mise en production
```

Après le premier déploiement :

1. Dans `index.html`, remplacez `og:image` par l'URL absolue `https://votre-projet.vercel.app/og-image.jpg`. WhatsApp exige une URL absolue. La page d'accès la calcule toute seule.
2. Dans Vercel, désactivez **Deployment Protection** (Settings → Deployment Protection) pour l'URL de production. Sans cela, les parents tombent sur un écran de connexion Vercel.

### Option B — Netlify, Cloudflare Pages, GitHub Pages

Publiez le dossier `public/` tel quel, sans commande de build. Netlify et Cloudflare lisent `_headers` automatiquement. Le fichier `middleware.js` est propre à Vercel : sur ces hébergeurs, l'accès repose seulement sur le lien privé.

## Confidentialité

- L'aperçu WhatsApp est neutre : titre « Une petite surprise ✉️ » et image d'une enveloppe fermée. Aucun texte d'annonce n'apparaît dans le HTML. Les textes sont dans `config.js` et l'échographie n'est chargée qu'au moment de l'ouverture.
- Il n'y a ni analytics, ni tracker, ni police Google : tout est hébergé sur votre domaine. Une CSP `default-src 'self'` bloque tout appel externe.
- La page porte `noindex, nofollow, noarchive, noimageindex` en balise meta et en en-tête HTTP, ainsi que `Referrer-Policy: no-referrer`.

### Contrôle d'accès par prénom (optionnel, Vercel)

Dans Vercel, ajoutez deux variables d'environnement (Settings → Environment Variables), puis redéployez :

```
ACCES_PRENOMS = mama, baba, salma, bastien, ماما, بابا, michel:grand-pere, sophie:tante
ACCES_SECRET  = (une longue chaîne aléatoire : openssl rand -base64 32)
```

Fonctionnement :

- Le middleware s'exécute côté serveur. Sans cookie valide, il ne sert ni la page, ni `config.js`, ni l'échographie : il affiche une page neutre qui demande le prénom.
- La comparaison ignore les majuscules, les accents, les espaces et la vocalisation arabe : « Mâma », « mama » et « مَاما » sont acceptés.
- Une fois le bon prénom saisi, un cookie signé valable un an est posé, et les parents ne le retapent plus.
- Retirer un prénom de la liste révoque l'accès correspondant.
- `prénom:fonction` associe une carte au prénom (`grand-pere`, `grand-mere`, `tante`, `oncle`, ou toute clé de `versions` dans `config.js`). Michel verra directement « Pour Papy ». Sans fonction, on a l'enveloppe classique pour toute la famille. Changer la fonction d'un prénom est pris en compte à sa visite suivante, et un lien `?pour=…` reste prioritaire.
- Pour tester en local : `npm run dev` exécute le middleware avec `.env.local` (`vercel dev` ne l'exécute pas sur ce projet).

Limite : un prénom se devine facilement. C'est une protection contre la découverte accidentelle, pas un coffre-fort. Pour un peu plus de sécurité, utilisez des prénoms moins évidents, ou combinez la liste avec un nom de projet Vercel difficile à deviner.

## Accessibilité et compatibilité

- Navigation complète au clavier : l'enveloppe est un `<button>` et le focus est visible et déplacé à chaque étape.
- Le message est annoncé par les lecteurs d'écran (`aria-live`).
- Les zones tactiles font au moins 48 px, les tailles de texte s'adaptent à la carte et la mise en page respecte les zones sûres de l'iPhone.
- `prefers-reduced-motion` remplace l'animation par des fondus simples.
- Si la Web Animations API est absente (très vieux navigateur), les étapes s'affichent sans animation.
- Seules les propriétés `transform`, `opacity` et `clip-path` sont animées, pour rester fluide sur Safari iOS et Chrome Android.
- Carte souvenir : sur mobile, la feuille de partage s'ouvre (« Enregistrer l'image » → Photos). Sur ordinateur, le PNG (1080 × 1566) est téléchargé directement.

## Avant d'envoyer le lien ✅

- [ ] Vraie échographie en place, informations personnelles du cliché masquées
- [ ] Textes relus (FR et/ou tunisien), `dueDate` décidée
- [ ] `og:image` passé en URL absolue
- [ ] Lien envoyé dans une conversation WhatsApp de test : l'aperçu ne révèle rien
- [ ] Parcours complet testé sur un iPhone et un Android
- [ ] Bouton « Enregistrer la carte » testé sur les deux

## Pistes d'amélioration (hors MVP)

- **Intro France ↔ Tunisie** : un court écran avant l'enveloppe, avec deux points reliés par un fil doré, du type « De Paris à Tunis… ».
- **Message vocal** : un court enregistrement de Salma et Bastien, lu sur la carte souvenir, uniquement à la demande.
- **Accusé d'ouverture** : sans tracker, une simple fonction Vercel peut vous envoyer une notification quand l'enveloppe est ouverte, pour que vous puissiez appeler juste après.
