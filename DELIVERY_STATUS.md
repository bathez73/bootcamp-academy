# BLOQUÉ — publication en attente de vérifications

Livraison locale isolée : Meta, cookies, masterclass et compteur interne sans cookie. Pixel 879987208126752 et Lead conservés ; aucun envoi Meta sans consentement, CAPI inactive. Chariow exclu. Rien déployé.

Tests : 15 tests unitaires/base de données réussis et 15 scénarios navigateur ciblés validés au cumul des exécutions (desktop, Android et iPhone émulés). La première exécution navigateur avait 12 réussites et 3 échecs de synchronisation du scénario ; navigation et attente de reprise réseau ont été corrigées, puis les scénarios concernés ont réussi. Pas de conversion Meta réelle ni d'inscription distante. TypeScript, compilation et lint des fichiers de livraison réussis. Le lint global échoue sur une erreur préexistante de CohortCheckout.tsx:43 (set-state-in-effect), conservé identique à origin/main.

Actions restantes :

1. Confirmer le SHA Netlify publié et une sauvegarde Supabase restaurable, puis tester la restauration en recette.
2. Vérifier les prérequis et droits Supabase (dont les droits sensibles de profiles signalés), appliquer en recette uniquement les migrations 20261019000300 et 20261019000400, puis vérifier les inscriptions réelles de recette et le compteur.
3. Valider Pixel Helper / Tester les événements Meta, téléphones physiques et configuration de confidentialité des journaux/transferts ; obtenir le feu vert explicite avant toute opération de production.

Le détail des vérifications et du retour arrière figure dans [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md). Précontrôles lecture seule : PRECHECK.sql et POSTCHECK.sql. Base distante vérifiée : 6b4f069c6a9bbb9d413a6eb64e6589ecbc4fa231 ; sa correspondance avec la production n'est pas établie.

Le patch portable MASTERCLASS_TRACKING_RELEASE.patch est placé à côté du dossier de livraison. L'appliquer uniquement à une copie propre de la base vérifiée, par git apply --check puis git apply. La publication depuis ce dossier ne doit pas partir automatiquement ; il n'a été ni poussé ni déployé.
