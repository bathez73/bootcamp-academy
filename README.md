# Novenetech Campus

Application Next.js : inscription, 28 missions, CRM personnel et formations Academy.

## Démarrage

1. Installer les dépendances avec npm install.
2. Renseigner .env.local à partir de .env.example.
3. Exécuter npm run dev.

## Mise en service de cette version

- Base existante : exécuter supabase/migrations/20260925_secure_payments.sql dans Supabase. Nouvelle base : exécuter supabase/schema.sql.
- Configurer SITE_URL avec l’origine HTTPS publique et autoriser /auth/callback dans les URL de redirection Supabase.
- Configurer Supabase, la clé service role (serveur uniquement), Kkiapay, Brevo et l’expéditeur validé. Sans Supabase, les espaces privés sont bloqués.
- Les PDF sont dans private/pdf et servis uniquement après vérification de l’achat associé au compte. Le traçage Next.js inclut ces fichiers lors du déploiement.
- Rapprocher manuellement les anciens achats avant publication : vérifier la transaction chez Kkiapay puis renseigner payments.user_id et verified. Aucun rattachement automatique par email.
- Tester un achat sandbox, sa notification webhook, l’email et le téléchargement avant d’activer le mode live. Les paiements sandbox ne doivent jamais alimenter la base de production : utiliser des projets, clés et secrets distincts.
- Tester confirmation d’email et réinitialisation du mot de passe avec la configuration Supabase utilisée.

## Paiements et livraison

Le webhook valide le secret partagé, la transaction, le montant et l’identité du compte confirmé. La prise en charge SQL conditionnelle empêche deux notifications concurrentes d’envoyer le même document en parallèle. Les achats vérifiés donnent accès au téléchargement même si l’email échoue.

Un paiement bloqué en processing nécessite une vérification dans Brevo : si l’email a été envoyé, passer à succes ; sinon repasser à email_echo pour permettre une nouvelle tentative. Une panne réseau après envoi peut rendre le résultat ambigu ; aucun renvoi automatique dans cet état.

L’inscription à la cohorte reste confirmée manuellement via WhatsApp. Le compte donne accès aux outils personnels ; il ne représente pas une place payée. Les dates, horaires, conditions commerciales et informations légales doivent être fournis par l’entreprise avant publication. Les 28 missions sont des exercices guidés, pas des vidéos ou une validation automatique du coaching.

## Vérifications

- npm run lint
- npm run typecheck
- node --experimental-strip-types --test tests/security.test.mjs
- npm run build
