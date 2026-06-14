# Setup Supabase V2

## 1. Creer le projet

- Ouvre [supabase.com](https://supabase.com)
- Cree un nouveau projet
- Garde ces 3 infos :
  - `Project URL`
  - `publishable key` ou `anon public key`
  - `service_role key`

## 2. Configurer le projet local

Dans `maison-waret-v2`, copie :

```bash
copy .env.example .env.local
```

Puis remplace au minimum :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

La V2 accepte maintenant soit `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, soit `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Si tu utilises la nouvelle nomenclature Supabase, mets simplement la `publishable key`.

## 3. Executer le SQL

Dans Supabase :

1. Ouvre `SQL Editor`
2. Colle puis execute `C:\Users\PC\Documents\Maison Waret !\Site internet\supabase-schema-v2.sql`
3. Colle puis execute `C:\Users\PC\Documents\Maison Waret !\Site internet\supabase-rls-v2.sql`

## 4. Authentication

Dans `Authentication` :

- laisse `Email` active
- tu pourras ensuite creer le premier admin principal
- les comptes manager et employe seront relies a la base

## 5. Ce que le schema couvre deja

- utilisateurs avec roles
- commandes
- lignes de commande
- journal d'evenements
- demandes d'informations complementaires
- reponses client avec canal `email` ou `sms`
- logs de notifications

## 6. Comment verifier

Lance le projet :

```bash
npm run dev
```

Puis ouvre :

- `http://localhost:3000`
- `http://localhost:3000/setup/supabase`

## 7. Quand tu as fini

Envoie-moi :

- confirmation que le projet Supabase est cree
- confirmation que les 2 scripts SQL sont passes
- les noms exacts des variables que tu as remplis
- la `service role key` si tu veux que je branche les actions serveur

Ensuite je fais la suite :

- auth Supabase reelle
- comptes reels owner / manager / employee
- protection admin par session Supabase
- migration du mode local vers la base reelle
