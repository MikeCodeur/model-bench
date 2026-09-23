---
name: model-bench
status: draft
created: 2026-09-23
updated: 2026-09-23
source_video: https://youtu.be/kiZLPw8EbUw
---

# Model Bench

Batterie de 40 projets réutilisables pour tester un nouveau modèle sur des livrables visibles et exécutables. Ce draft prépare les prompts, la sélection d'un modèle et les workspaces isolés. Il ne branche pas encore les API des fournisseurs.

## Ce que fait la vidéo de référence

La vidéo combine trois couches différentes :

1. **Annonce** : synthèse des specs, prix, vitesse, benchmarks officiels et sécurité annoncée.
2. **Tests de masse** : 565 tests textuels et 527 tests de sécurité/alignement, avec résultats agrégés.
3. **Projets visibles** : environ cinquante expériences 3D, landing pages et simulations, montrées rapidement à l'écran.

Les chapitres permettent d'identifier seize familles de projets : Rubik 3D, pile de caisses, masque creux, storyboard 3D, saisons, trou noir, visages/émotions, mots croisés, galaxie de particules, feu de forêt, scène de spectacle, livre courbé, vue éclatée, spirale des nombres premiers et Mandelbrot, plus les landing pages montrées au début des tests visuels.

Le format fonctionne en vidéo parce qu'il alterne :

- slides courtes sur les faits du modèle ;
- galerie de résultats immédiatement lisibles ;
- tests difficiles qui produisent des échecs visibles ;
- verdict final coût / qualité / fiabilité.

## Limite de l'analyse

Les prompts exacts ne figurent pas dans la description YouTube. Les sous-titres et chapitres confirment les familles de tests mais pas leur texte complet. Les briefs `video-reconstructed` de `benchmarks.json` sont donc des reconstructions originales, pas des copies ni des citations mot pour mot.

## Pourquoi ne pas reprendre des prompts GitHub tels quels

Plusieurs repos couvrent déjà le même terrain :

- [jdmnk/design-benchmark](https://github.com/jdmnk/design-benchmark) : génération multi-modèles, rendu Chromium, grilles et vidéos déterministes ;
- [karminski/awesome-llm-benchmark-prompts](https://github.com/karminski/awesome-llm-benchmark-prompts) : prompts visuels complexes ;
- [zai-org/Vision2Web](https://github.com/zai-org/Vision2Web) : score visuel + score fonctionnel ;
- [s-macke/coding-agent-benchmark](https://github.com/s-macke/coding-agent-benchmark) : tâches agentiques récurrentes ;
- [alton47/threejs-skills](https://github.com/alton47/threejs-skills) : règles techniques Three.js.

Les prompts de `awesome-llm-benchmark-prompts` et les données Vision2Web sont en CC-BY-NC-SA-4.0. La chaîne YouTube de Mike ayant un usage commercial, aucun prompt n'est copié. Seules les familles de capacités et les idées génériques sont utilisées. Les 40 briefs sont rédigés pour ce repo.

## Répartition des 40 benches

- 14 projets 3D
- 9 simulations 2D / math / algorithmes
- 9 frontends
- 4 jeux
- 4 projets de code agentique

Chaque entrée contient : identifiant stable, difficulté, provenance, brief, critères d'acceptation et type de capture.

## Commandes

Lister la suite :

```bash
python scripts/prepare-run.py --list
```

Valider le catalogue :

```bash
python scripts/validate-suite.py
```

Préparer un run complet :

```bash
python scripts/prepare-run.py \
  --model claude-opus-5-5 \
  --output /tmp/model-bench-opus-5-5
```

Préparer seulement une catégorie ou quelques IDs :

```bash
python scripts/prepare-run.py \
  --model claude-opus-5-5 \
  --category 3d \
  --output /tmp/model-bench-3d

python scripts/prepare-run.py \
  --model claude-opus-5-5 \
  --ids 3d-06-black-hole-lensing,web-01-ai-saas-landing \
  --output /tmp/model-bench-smoke
```

Le préparateur crée un dossier par projet avec `PROMPT.md`, `benchmark.json` et un `run.json` global. Il refuse d'écraser un dossier non vide sans `--force`.

## Architecture cible du runner

```text
benchmarks.json
      |
      v
prepare-run.py -> runs/<date>/<model>/<bench-id>/
                              | prompt + metadata
                              v
                    provider adapter (à construire)
                  / Claude / OpenAI / OpenRouter
                              |
                              v
                   projet isolé + logs bruts
                              |
             +----------------+----------------+
             |                                 |
        checks déterministes             Playwright
        tests / console / build       screenshots / vidéo
             |                                 |
             +----------------+----------------+
                              v
                 report.json + galerie HTML
```

## Protocole de comparaison

1. Même version de prompt, mêmes outils, même timeout et même budget pour tous les modèles.
2. Un contexte neuf et un workspace isolé par projet.
3. Aucun correctif humain pendant le run principal.
4. Seed fixe dès qu'une simulation l'autorise.
5. Captures aux mêmes viewports, au même instant virtuel et avec le réseau coupé pendant le rendu.
6. Séparer le **delivery gate** du score : un projet qui ne démarre pas ne reçoit pas de note visuelle artificielle.
7. Mesurer durée, tokens, coût, erreurs console et critères fonctionnels.
8. Juger les captures en aveugle avant d'afficher le nom du modèle.
9. Conserver prompts, sorties brutes, logs, screenshots, vidéos et version exacte du runner.
10. Comparer au modèle précédent par catégorie, pas seulement par score global.

## Score proposé

- Delivery gate : démarre / ne démarre pas
- Fonctionnel : 40 points
- Visuel : 40 points
- Engineering : 20 points

Le score total n'est calculé que si le delivery gate passe. Les tests agentiques sans UI utilisent 60 points fonctionnels et 40 points engineering.

## Étapes suivantes

- brancher un premier adapter de modèle ;
- fournir une image Docker commune avec Chromium et les dépendances 2D/3D ;
- exécuter un smoke test sur 3 benches ;
- ajouter capture vidéo déterministe et galerie comparative ;
- calibrer les rubriques sur deux modèles avant de figer la v1.
