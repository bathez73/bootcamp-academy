# Masterclass du 24 octobre — livraison locale

Statut : BLOQUÉ pour publication, en attente des vérifications de production ci-dessous. Aucun déploiement, aucune migration distante, aucune conversion réelle effectués.

## Périmètre

Base distante vérifiée : 6b4f069c6a9bbb9d413a6eb64e6589ecbc4fa231 (origin/main). Ce SHA n'est pas une preuve de la version actuellement publiée sur Netlify. Dossier Git isolé ; aucun fichier Chariow, aucune migration Bootcamp, aucun changement des paiements Academy/Cohort, du middleware ou des droits Campus. Les styles et ajustements du formulaire masterclass déjà terminés sont inclus comme dépendances du formulaire testé.

Pixel 879987208126752 et Lead conservés. PageView et Lead Meta restent soumis à un consentement publicitaire valide. CAPI inactive ; aucun secret supplémentaire nécessaire.

Le compteur interne fonctionne sans choix au bandeau : vue visible d'une page commerciale, routes internes et retour arrière ; un rafraîchissement est une nouvelle vue, les ancres/paramètres de campagne ne le sont pas. Identifiant aléatoire de chaque vue uniquement en mémoire, sans cookie ni identifiant visiteur ; requête sans cookies ni referrer. Les reprises gardent le même identifiant et la base crédite atomiquement une seule fois. Pas de coordonnées, IP, appareil, UTM ni lien avec les inscriptions en base de statistiques. Reçus valides 24 heures, totaux par jour/page 400 jours ; purge à la réception suivante. Limiter aussi les journaux de l'hébergeur : aucun corps de requête ou rapprochement avec les logs de connexion.

Les chiffres sont des vues observées par JavaScript, pas des visiteurs uniques : robots, réseau coupé, bloqueurs ou horloge incorrecte peuvent affecter les résultats. Le serveur ne peut pas prouver qu'un POST public est une visite humaine. Prévoir la protection anti-abus de l'hébergeur sans fingerprinting. Les inscriptions sont comptées directement en base ; doublon, erreur et honeypot ne créent pas de Lead.

## Conditions avant feu vert

1. Confirmer le SHA/identifiant Netlify actuellement publié et préserver son déploiement pour retour arrière. Comparer à la base de cette livraison ; si différent, reporter le patch sur la vraie base puis vérifier la différence.
2. Confirmer une sauvegarde Supabase récente et restaurable, son horodatage et la disponibilité du PITR selon le plan. Sauvegarder schéma et données dans un emplacement privé chiffré hors Git ; contrôler le catalogue de sauvegarde et faire une restauration dans une base de recette isolée. Ne pas copier de secrets ou de données participants dans ce dépôt/rapport. Aucune sauvegarde distante ni restauration réelle n'a été vérifiée ici.
3. Exécuter PRECHECK.sql en lecture seule sur la cible et comparer les migrations déjà appliquées. Prérequis : migrations masterclass 20261003, 20261006, 20261007. Vérifier les trois variables Supabase déjà utilisées (URL publique, clé publique, service role côté serveur), sans afficher leurs valeurs.
4. Sur recette restaurée, appliquer uniquement 20261019000300_masterclass_meta_event.sql puis 20261019000400_internal_pageviews.sql, par le processus de migration habituel avec historique cohérent. Ne pas lancer un push global depuis le dossier de travail Chariow. Ces migrations sont transactionnelles et additives ; aucune inscription n'est effacée. Exécuter POSTCHECK.sql et vérifier les permissions. Les éventuels droits sensibles de profiles encore modifiables doivent être corrigés par la livraison de sécurité avant de faire confiance à l'accès administrateur ; cette livraison tracking n'applique pas la migration de sécurité en attente.
5. Faire une inscription de recette dans Supabase isolé, vérifier compteur interne, nouvel UUID, doublon sans Lead ; vérifier Pixel Helper et Tester les événements Meta avec le media buyer, puis un Android/iPhone physique. Les tests locaux interceptent le SDK et ne prouvent pas la réception dans Meta.
6. Valider le traitement interne et les journaux/transferts auprès du responsable conformité, ainsi que les règles Meta actuelles dans le compte. Obtenir le feu vert explicite avant toute publication ou opération de production.

## Retour arrière

En cas d'échec avant publication : ne pas publier. Chaque migration échouée est annulée par sa transaction.

Après publication autorisée : republier le déploiement Netlify précédent identifié à l'étape 1. Garder les tables/colonnes additives : l'ancien INSERT reste compatible et les nouvelles inscriptions sont conservées (test local réussi). Ne pas supprimer les UUID ni restaurer aveuglément un ancien dump, qui ferait perdre les inscriptions arrivées depuis la sauvegarde. Toute restauration de données exige une procédure distincte avec gel des écritures et rapprochement des nouvelles inscriptions. Désactiver l'ingestion des vues via la protection hébergeur si nécessaire. Attention : republier l'ancien code réintroduit ses anciennes limites de consentement ; suspendre la collecte publicitaire en cas d'incident de confidentialité.

## Fondement de la décision Meta

L'article 389 du Code du numérique publié par l'APDP prévoit le consentement et des exceptions liées notamment à une obligation légale, une mission publique ou un contrat. Ces exceptions ne démontrent pas que l'optimisation publicitaire Meta serait nécessaire à la réservation d'une masterclass. Les articles 391/392 et 415 concernent notamment transferts et information. Aucun fondement permettant ici l'envoi publicitaire systématique sans accord n'est établi ; ne pas importer automatiquement une exemption française de mesure d'audience dans le contexte béninois. La mesure interne minimisée et indépendante est distincte de l'attribution publicitaire ; faire valider aussi la configuration réelle de l'hébergement et les textes applicables/modifiés.

Sources consultées le 19 octobre 2026 :

- [Code du numérique, version APDP, notamment article 389, pages PDF 366–368](https://apiprod.apdp.bj/storage/c46ab3f55e93d40c8545b70add0ea8c7/CODE-DU-NUMERIQUE-DU-BENIN_2018-version-APDP.pdf).
- [Formulaire APDP : information, traceurs et retrait](https://apiprod.apdp.bj/storage/8d94349954e81d8e88f3a6066aa55c71/Formulaire-complementaire-site-web-.pdf).
- [Conditions Meta Business Tools](https://www.facebook.com/legal/terms/businesstools) : accès redirigé vers une connexion, validation complète actuelle non établie.

CAPI ne supprime pas ces obligations. Toute activation future nécessite un consentement vérifiable et actualisable côté serveur, une boîte d'envoi idempotente, le même couple Lead/event_id que le Pixel, et des secrets serveur uniquement. Aucun rattrapage de visiteurs silencieux ou ayant refusé.
