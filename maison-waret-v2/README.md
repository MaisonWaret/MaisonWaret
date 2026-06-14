# Maison Waret V2

Base Next.js de la vraie V2 du site Maison Waret.

## Ce qui est deja present

- page d'accueil V2 plus premium
- dashboard admin V2
- roles visibles : admin principal, manager, employe
- commandes de demonstration
- logique de demandes d'informations complementaires
- affichage de la reponse client avec canal visible : email ou SMS

## Fichiers importants

- `src/app/page.tsx` : vitrine V2
- `src/app/admin/page.tsx` : dashboard admin V2
- `src/app/login/page.tsx` : connexion admin separee
- `src/components/order-card.tsx` : carte commande + complements client
- `src/components/setup-status.tsx` : etat local / Supabase
- `src/lib/mock-data.ts` : donnees de demo et structure de base
- `src/lib/local-auth.ts` : auth locale de transition
- `src/lib/supabase/client.ts` : client navigateur Supabase
- `src/lib/supabase/server.ts` : client serveur Supabase
- `src/lib/supabase/admin.ts` : client admin serveur avec `service_role`
- `.env.example` : variables a remplir pour la vraie V2
- `SUPABASE-SETUP.md` : guide pas a pas pour activer la vraie base

## Lancer le projet

```bash
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Etat actuel

Cette V2 tourne pour l'instant avec des donnees mockees.
La prochaine etape sera de brancher :

- Supabase Auth
- base de donnees reelle
- roles owner / manager / employee
- commandes reelles
- demandes d'infos complementaires stockees en base
- reponses client email / SMS rattachees aux commandes

## Supabase

La fondation Supabase est maintenant ajoutee dans le projet :

- packages Supabase installes
- variables d'environnement preparees
- clients navigateur et serveur ajoutes
- compatibilite `publishable key` et `anon key`
- schema SQL prevu pour :
  - comptes et roles
  - commandes
  - demandes d'informations complementaires
  - reponses client email / SMS

Tant que les variables Supabase ne sont pas renseignees, la V2 continue a fonctionner en mode local.
Une checklist visuelle est aussi dispo sur `/setup/supabase`.

## Paiement

Le paiement n'est pas encore fige.
La structure V2 permet de commencer sans paiement bloque, puis d'ajouter un lien de paiement plus tard.
