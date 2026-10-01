# Configuration de Novenetech Campus

Projet Supabase : `ewnxedfglakqnyuctesk` (offre gratuite indiquée par le propriétaire).
URL API : `https://ewnxedfglakqnyuctesk.supabase.co`.

## État local

Le fichier `.env.local`, ignoré par Git, contient l'URL API et
`SITE_URL=http://localhost:3000`. La clé publique Publishable est renseignée dans
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

La CLI est connectée et le dossier est lié au projet. Après vérification que le
schéma public était vide, les migrations `20260924_initial_schema.sql` et
`20260925_secure_payments.sql` ont été appliquées avec succès via `supabase db push`.

Vérifications après application : Auth répond HTTP 200, connexion par email
activée et confirmation d'email requise. Les quatre tables `profiles`,
`crm_prospects`, `progress` et `payments` répondent HTTP 200 avec la clé publique.
Les contrôles SQL confirment RLS sur les quatre tables, avec respectivement
2, 4, 4 et 3 politiques. Les colonnes de paiement `user_id` et `verified` sont
accessibles à l'API.

Le 1er octobre 2026, les redirections locales et publiques ont été appliquées via
`supabase config push` et relues avec `supabase config diff` (aucune différence
sur les propriétés déclarées). Les autres paramètres distants, notamment la
confirmation d'email obligatoire, ont été conservés. `supabase/config.toml`
déclare uniquement l'origine et les redirections Auth. L'origine distante est
`https://bootcamp-academy.lvh.bj`, qui répond HTTP 200. `.env.local` conserve
`SITE_URL=http://localhost:3000` pour terminer les essais sur cette machine.

Le formulaire réel `/signup` a créé le compte de test demandé et son profil.
La réception de l'email a été confirmée par une capture fournie par le
propriétaire. Avant confirmation, la connexion refusait correctement le compte
(`email_not_confirmed`). Après ouverture du lien par le propriétaire, l'email
est confirmé. Le retour automatique a échoué avec `authError=1`, le navigateur
ne disposant pas du vérificateur PKCE de la session technique d'inscription.
La connexion par le formulaire réel `/login` est validée (HTTP 303 vers
`/dashboard`), avec cookies de session et tableau de bord authentifié HTTP 200.
Le profil est accessible avec le rôle étudiant (`is_admin=false`).

Le propriétaire doit choisir son mot de passe via `/forgot-password`, en
démarrant la demande puis en ouvrant le lien reçu dans le même navigateur.
Après l'échec signalé, un test navigateur Edge isolé a révélé des erreurs CSP
en développement : React nécessite `unsafe-eval` en développement uniquement.
La CSP locale a été corrigée ; celle de production reste inchangée. Le formulaire
affiche désormais une confirmation explicite après enregistrement, sans
redirection immédiate, ainsi que des erreurs françaises et un lien de nouvelle
demande. Le test sur un compte temporaire distinct valide le refus du mot de
passe identique, l'enregistrement d'un nouveau mot de passe et la connexion avec
celui-ci. Ce compte temporaire a été supprimé. Aucun mot de passe du propriétaire
n'a été modifié pendant ce test. Le propriétaire doit refaire sa demande dans
son navigateur ; les achats restent à valider.

Après un nouvel échec du lien reçu, le callback a été étendu à la vérification
directe `token_hash` / `type=recovery`. Un test dans un navigateur sans cookies
valide l'ouverture du formulaire depuis ce lien, le changement de mot de passe,
la connexion et le refus d'une seconde utilisation du même lien. Les liens de
récupération invalides reviennent maintenant vers la demande de nouveau lien.

Le modèle français `supabase/templates/recovery.html` est prêt mais **non
appliqué** : Supabase a refusé son déploiement HTTP 400, car l'offre gratuite
avec l'expéditeur par défaut n'autorise pas la modification des modèles.
Connecter un SMTP personnalisé (Brevo) avant d'activer ce modèle. L'adresse
d'expéditeur et la clé API Brevo seules ne suffisent pas : il faut les
identifiants SMTP. Le modèle actuel distant reste inchangé.

Un lien de récupération à usage unique a été ouvert directement dans le
navigateur du propriétaire pour qu'il choisisse lui-même son mot de passe.
Ni le lien ni le mot de passe n'ont été affichés ou enregistrés par ce script.

Le contrôle des pages privées était ignoré car `middleware.ts` était à la racine
alors que l'application est sous `src`. Il est maintenant dans `src/proxy.ts`,
conformément à Next.js 16. Les requêtes anonymes vers `/dashboard`, `/crm`,
`/ressources` et `/admin` redirigent vers `/login` (HTTP 307). `/academy` reste
publique et ses paiements restent désactivés en configuration incomplète.

## Connexion et base de données

1. Dans [API Keys](https://supabase.com/dashboard/project/ewnxedfglakqnyuctesk/settings/api),
   copier la clé publique Publishable ou la clé historique anon dans
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` du fichier `.env.local`.
   Ce nom de variable existant accepte aussi une clé Publishable.
2. La base de ce projet est déjà initialisée. Pour les prochaines migrations,
   utiliser `supabase db push --dry-run`, puis `supabase db push` après contrôle.
   Ne pas relancer `supabase/schema.sql` : ses instructions de création des
   politiques ne sont pas idempotentes. Pour une autre base neuve, choisir
   soit les migrations CLI, soit le schéma complet via SQL Editor.
3. Dans [Authentication → URL Configuration](https://supabase.com/dashboard/project/ewnxedfglakqnyuctesk/auth/url-configuration),
   Site URL est configurée sur `https://bootcamp-academy.lvh.bj` avec ces redirections :
   - `http://localhost:3000/auth/callback?next=/inscription`
   - `http://localhost:3000/auth/callback?next=/auth/reset-password`
   - `https://bootcamp-academy.lvh.bj/auth/callback?next=/inscription`
   - `https://bootcamp-academy.lvh.bj/auth/callback?next=/auth/reset-password`
4. Démarrer avec `npm.cmd run dev` sous PowerShell. Après chaque changement de
   `.env.local`, redémarrer le serveur.
5. Vérifier une inscription, la confirmation par email, la connexion, la
   réinitialisation du mot de passe, puis l'enregistrement d'un prospect et d'une
   mission. Avec deux comptes, vérifier l'isolation des données.

## Mise en ligne et achats

Lors du déploiement, renseigner `SITE_URL=https://bootcamp-academy.lvh.bj` et
définir les variables dans l'hébergement. Les variables de l'hébergement n'ont
pas été modifiées depuis cette session.

La clé `SUPABASE_SERVICE_ROLE_KEY` est maintenant renseignée dans `.env.local`
après autorisation explicite. Les paramètres Kkiapay et Brevo restent manquants.
Pour les saisir localement sans afficher les secrets, exécuter depuis le dossier
du projet :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\configure-services.ps1
```

La clé service_role doit rester uniquement dans l'environnement serveur.
Conserver des environnements distincts pour les achats sandbox et réels.
L'expéditeur fourni `novenetech@gmail.com` est renseigné dans `.env.local`.
Sa validation effective dans Brevo reste à vérifier avec la clé API.
L'URL du webhook à renseigner chez Kkiapay sera
`https://bootcamp-academy.lvh.bj/api/kkiapay-webhook` après déploiement de cette
version et des variables serveur. Aucun paiement test ou réel n'a été lancé.

Références : [clés API](https://supabase.com/docs/guides/getting-started/api-keys)
et [redirections Auth](https://supabase.com/docs/guides/auth/redirect-urls).
