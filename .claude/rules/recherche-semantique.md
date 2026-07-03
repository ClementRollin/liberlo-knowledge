# Recherche sémantique & embeddings

## Principe général

Chaque article est vectorisé (title + content + tags + summary) au moment
de sa création ou de sa mise à jour significative. La requête utilisateur
est elle-même vectorisée à la volée, puis comparée aux embeddings stockés
via une recherche par similarité cosinus (pgvector).

## Étapes techniques

1. **Génération des embeddings** — déclenchée à la création/MàJ d'article,
   stockée dans le champ `vector` (pgvector) de l'entité Article.
2. **Recherche** (`POST /search`) :
   - embedding de la requête
   - calcul de similarité cosinus contre les embeddings existants
   - tri par pertinence
   - filtrage par droits utilisateur, service, visibilité, statut = publié
3. **Résultats affichés** : titre, extrait/résumé, service, auteur, date de
   dernière mise à jour.

## Évolution prévue (hors MVP, v1.1/v2)

RAG (Retrieval Augmented Generation) : récupération des articles les plus
pertinents, injection dans le prompt, génération d'une réponse synthétique
**avec citation explicite des sources internes** — ne jamais générer de
réponse sans traçabilité vers les articles sources.

## Points de vigilance techniques

- Ne pas indexer un article en statut "brouillon" dans la recherche.
- Respecter les filtres de droits/visibilité **avant** le calcul de
  similarité, pas après (éviter les fuites d'information par le ranking).
- Documenter le choix du modèle d'embeddings utilisé (dimension du vecteur,
  fournisseur) — actuellement embeddings via API externe (à confirmer selon
  implémentation retenue).

## Lien avec le benchmark du mémoire

Ces mécanismes (embeddings + RAG) sont positionnés dans le mémoire comme
une version simplifiée et ciblée des principes observés chez Dust
(cf. partie 2 du mémoire). Rester cohérent avec ce positionnement : le
prototype ne doit pas chercher à reproduire l'ensemble des fonctionnalités
de Dust, mais à démontrer la faisabilité des principes retenus.
