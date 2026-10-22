# Novenetech Campus

Application Next.js : inscription, 28 missions, CRM personnel et formations Academy.

## Démarrage

1. Installer les dépendances avec npm install.
2. Renseigner .env.local à partir de .env.example.
3. Exécuter npm run dev.

## Mise en service de cette version

- Base existante : exécuter supabase/migrations/20260925_secure_payments.sql dans Supabase. Nouvelle base : exécuter supabase/schema.sql.
- Configurer SITE_URL avec l’origine HTTPS publique et autoriser /auth/callback dans les URL de redirection Supabase.
- Configurer Supabase, la clé service role (serveur uniquement), Brevo et l’expéditeur validé. Sans Supabase, les espaces privés sont bloqués.
- Les PDF sont dans private/pdf et servis uniquement après vérification de l’achat associé au compte. Le traçage Next.js inclut ces fichiers lors du déploiement.
- Tester confirmation d’email et réinitialisation du mot de passe avec la configuration Supabase utilisée.

## Paiements et accès

L’accompagnement est vendu sur Chariow (lien public dans src/lib/bootcamp-sales-config.ts) ; le site n’encaisse aucun paiement. Après avoir vérifié une vente dans Chariow, un administrateur autorise le compte de l’acheteur depuis /admin, à partir de son email. Seule cette autorisation ouvre les cours.

La table payments conserve l’historique des anciens achats ; les achats vérifiés restent téléchargeables depuis /academy.

L’inscription à la cohorte reste confirmée manuellement. Le compte donne accès aux outils personnels ; il ne représente pas une place payée. Les dates, horaires, conditions commerciales et informations légales doivent être fournis par l’entreprise avant publication. Les 28 missions sont des exercices guidés, pas des vidéos ou une validation automatique du coaching.

## Vérifications

- npm run lint
- npm run typecheck
- node --experimental-strip-types --test tests/security.test.mjs
- npm run build
