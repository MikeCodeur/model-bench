---
name: model-bench
description: Préparer et piloter un run de la batterie model-bench sur un modèle (sélection de tests, workspaces isolés, métriques, rapport vidéo). Utiliser quand on demande de lancer un bench, tester un nouveau modèle ou préparer un run.
status: draft
created: 2026-09-23
updated: 2026-09-23
used_by_agents: []
---

# Model Bench Runner

## Description

Prépare et pilote une batterie fixe de projets pour comparer un nouveau modèle à ses prédécesseurs. Le skill impose des workspaces isolés, des prompts identiques, des preuves d'exécution et un rapport exploitable dans une vidéo.

## Instructions

### 1. Cadrer le run

Demander ou récupérer :

- l'identifiant exact du modèle et du fournisseur ;
- le modèle de comparaison ;
- la suite complète ou les catégories/IDs à lancer ;
- le budget maximal, le timeout et la concurrence ;
- le niveau d'effort ou reasoning ;
- l'adapter disponible pour invoquer le modèle.

Ne jamais normaliser un identifiant de modèle fourni par Mike. Enregistrer la route exacte dans `run.json`.

### 2. Valider la suite

Depuis la racine du repository `model-bench`, exécuter :

```bash
python scripts/validate-suite.py
```

Le run ne démarre que si le catalogue contient exactement 40 IDs uniques et si le validateur termine sans erreur.

### 3. Préparer les workspaces

Exécuter :

```bash
python scripts/prepare-run.py \
  --model "{{MODEL_ID}}" \
  --output "{{RUN_DIR}}"
```

Pour un smoke test, utiliser `--ids` avec un test 3D, un frontend et un test agentique. Ne pas lancer les 40 projets avant que ce smoke test ait produit trois livrables exécutables.

### 4. Lancer les projets

- Utiliser un contexte neuf et un workspace distinct par benchmark.
- Injecter le contenu de `PROMPT.md` sans le réécrire selon le modèle.
- Garder mêmes outils, dépendances, timeout, budget, seed et niveau d'effort entre modèles.
- Autoriser au maximum un retry sur erreur fournisseur transitoire. Ne pas corriger le code du modèle pendant le run principal.
- Capturer stdout, stderr, sortie brute du modèle, durée, tokens et coût.
- Marquer un projet `failed` si aucun livrable exécutable n'est produit. Ne jamais fabriquer de métrique manquante.

### 5. Vérifier les projets

Pour chaque workspace :

1. Installer avec les versions verrouillées prévues par l'image du runner.
2. Exécuter build, tests et checks déterministes.
3. Lancer le projet en local.
4. Collecter erreurs console et requêtes réseau échouées.
5. Pour les projets visuels, capturer `1440x900` et `390x844`.
6. Pour `video` ou `both`, enregistrer cinq secondes après un pré-roll identique.
7. Reporter chaque critère d'acceptation en `pass`, `fail` ou `blocked`, avec preuve.

Un HTTP 200 ou un screenshot seul ne prouve pas que l'interaction fonctionne.

### 6. Noter sans mélanger les dimensions

- **Delivery gate** : démarre ou ne démarre pas.
- **Fonctionnel** : critères d'acceptation et interactions.
- **Visuel** : composition, lisibilité, cohérence, finition.
- **Engineering** : structure, performance, robustesse, accessibilité.

Ne calculer le score sur 100 que si le delivery gate passe. Pour les tâches sans UI, utiliser 60 points fonctionnels et 40 points engineering. Conserver aussi les résultats bruts; le score global ne doit jamais masquer les échecs par catégorie.

### 7. Produire le package vidéo

Générer :

- `report.json` avec toutes les métriques ;
- `report.md` avec verdict par catégorie ;
- une galerie de screenshots étiquetés après le jugement en aveugle ;
- une grille ou vidéo comparative pour les projets animés ;
- une section `annonce fournisseur` séparée des résultats observés ;
- une section `échecs visibles` avec logs et captures ;
- coût total, durée totale et coût par projet livré.

Le script vidéo doit distinguer ce que le fournisseur annonce, ce que le benchmark public mesure et ce que ce run a réellement démontré.

## Inputs

- `MODEL_ID` : identifiant ou route exacte du modèle
- `BASELINE_MODEL_ID` : modèle de comparaison facultatif
- `RUN_DIR` : dossier de sortie vide
- `BENCHMARK_IDS` ou `CATEGORY` : sélection facultative
- `TIMEOUT`, `MAX_CONCURRENCY`, `BUDGET`, `EFFORT`
- adapter/provider configuré pour lancer le modèle

## Outputs

- workspaces isolés avec prompts et métadonnées ;
- code généré et sorties brutes ;
- tests, logs, screenshots et vidéos ;
- métriques coût/temps/tokens ;
- rapport comparatif et package de preuves pour la vidéo.

## Exemples

### Input

```text
Modèle : claude-opus-5-5
Suite : smoke test
IDs : 3d-06-black-hole-lensing, web-01-ai-saas-landing, agent-01-task-api
Concurrence : 3
Timeout : 20 minutes par projet
```

### Output attendu

```text
Run préparé avec 3 workspaces isolés.
3 prompts inchangés.
Chaque résultat contient : statut, durée, tokens, coût, checks, logs et captures requises.
Le rapport sépare livraison, fonctionnel, visuel et engineering.
```
