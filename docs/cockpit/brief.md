# Brief design — Cockpit model-bench

## En une phrase

Le cockpit où je lance des modèles d'IA sur une batterie de projets concrets (une scène 3D, une landing page, un jeu, une API), où je les regarde travailler, puis où je compare ce qu'ils ont construit.

Je suis créateur YouTube tech. Le cockpit est mon outil de travail, mais il apparaîtra aussi à l'écran dans mes vidéos : il doit être beau filmé.

## Direction artistique

L'esprit de Hugging Face et d'OpenRouter : un outil de développeur, sérieux et lisible, où les données sont les héroïnes.

- Des surfaces neutres, des bordures fines, très peu d'ombres.
- Des cartes sobres et des tableaux denses mais aérés.
- La police monospace pour tout ce qui est technique : identifiants, commandes, coûts, tokens.
- Les démos (captures de scènes 3D, de pages, de jeux) apportent la couleur. L'interface autour reste calme pour les mettre en valeur.
- Une seule couleur d'accent, orange `#E07A5F`, réservée aux actions et à ce qui est actif.
- Un thème clair et un thème sombre, aussi soignés l'un que l'autre.
- À éviter : dégradés décoratifs, illustrations, effets gadget.

## Ce qu'on manipule

**Un modèle.** Nom, fournisseur, outil utilisé pour le lancer, et son bilan : nombre de runs, taux de réussite, coût moyen par projet.
Exemple : *Opus 5.5 · Anthropic · via Claude Code · 10/10 livrés · 2,05 $ par projet en moyenne.*

**Un bench (un projet de test).** Titre, catégorie (3D, simulation, frontend, jeu, code agentique), difficulté, une miniature de ce qu'un modèle a produit, et le meilleur résultat obtenu par chaque modèle.
Exemple : *Trou noir et disque d'accrétion · 3D · avancé · capture du rendu.*

**Un run.** Un modèle lancé sur une sélection de benchs à une date donnée : sa progression, son score global, son coût et sa durée totale.
Exemple : *Opus 5.5 · 23/09/2026 · 10 projets · 10 livrés · 20,45 $ · 1 h 46.*

**Une tentative (un résultat).** Ce qu'un modèle a produit sur un bench : une démo qu'on peut ouvrir et manipuler, le code, le journal de travail de l'agent, et des métriques (durée, coût, tokens, démarre ou non, tests réussis). Une tentative peut être retouchée : on garde la v1 et on obtient une v2.
Exemple : *Trou noir v1 : 23 min, 2,07 $ → v2 avec panneau de réglages : 6 min, 1,03 $.*

## Ce que je veux pouvoir faire

1. **Choisir un modèle et des benchs, puis lancer.** Je sélectionne un modèle, je coche des benchs (ou une catégorie entière), je vois un récapitulatif (nombre de projets, durée maximale), et je confirme.
2. **Suivre en direct.** Je vois le run avancer projet par projet : celui qui tourne, depuis combien de temps, ceux qui sont finis et leur résultat, et le coût qui monte. Je peux arrêter.
3. **Visualiser un résultat.** J'ouvre la démo dans le cockpit, je joue avec ses réglages, puis je regarde le prompt, le code et ce que l'agent a fait étape par étape.
4. **Comparer.** Je mets côte à côte deux à quatre résultats du même bench : deux modèles différents, ou la v1 et la v2 d'un même modèle. Un mode aveugle cache les noms des modèles pour juger sans biais.
5. **Relancer ou retoucher.** Depuis un résultat, je relance le bench, ou je demande une retouche (« ajoute un panneau de réglages ») qui produit une nouvelle version.
6. **Naviguer vite.** Je passe d'un modèle à l'autre, d'un run à l'autre, d'un bench à l'autre sans revenir en arrière, grâce à un fil d'Ariane où chaque niveau se change d'un clic, et à une palette de commandes ⌘K.

## Les états à rendre lisibles d'un coup d'œil

Chaque résultat est toujours dans l'un de ces états, qui doivent se distinguer immédiatement sur une carte comme dans un tableau :

| État | Sens | Ce qu'on affiche |
| --- | --- | --- |
| En attente | pas encore lancé dans ce run | discret |
| En cours | l'agent travaille | animation sobre, temps écoulé |
| Livré | fini, et la démo démarre | vert, score et coût |
| Livré, ne démarre pas | fini, mais le projet ne se lance pas | alerte |
| Erreur | l'agent a échoué | rouge |
| Timeout | coupé après 30 minutes | ambre |
| Arrêté | stoppé à la main | gris |
| Retouché | une v2 existe | badge « v2 » |

**Le score.** Un résultat affiche un score quand il a été noté : sur 100, décomposé en fonctionnel, visuel et engineering. Avant la notation, on affiche seulement « livré » ou non, plus les métriques. Le score doit pouvoir devenir l'élément principal d'une carte ou d'un classement.

## Les écrans clés

Donne ta propre mise en page ; voici ce qu'ils doivent permettre :

- **Accueil** : les runs en cours, les derniers résultats, les chiffres clés.
- **Catalogue des benchs** : une galerie de cartes filtrable par catégorie, à la manière des cartes de modèles de Hugging Face.
- **Classement des modèles** : à la manière d'OpenRouter, qui réussit le mieux, à quel prix, en combien de temps.
- **Un run** : la liste de ses projets avec leur état, leur score et leurs actions.
- **Un résultat** : la démo en grand, puis le prompt, le code, le journal et les métriques.
- **Comparer** : les démos côte à côte avec leurs chiffres dessous.
- **Lancer un run** : choix du modèle et des benchs, puis confirmation.

## Contraintes

- Desktop d'abord (1440 px), lisible filmé en 1080p ; tablette correcte.
- Contrastes conformes à l'accessibilité AA dans les deux thèmes.
- Le design sera intégré avec shadcn/ui et Tailwind 4. Fournis les couleurs sous forme de tokens nommés (fond, surface, bordure, texte, texte secondaire, accent, états) pour le clair et le sombre, et pas d'effets impossibles à reproduire en CSS.
- Polices : une sans-serif sobre (Inter ou équivalent) et une monospace (JetBrains Mono ou équivalent).
