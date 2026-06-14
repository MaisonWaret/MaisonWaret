# Maison Waret - Plan V2 Pro

## Objectif
Passer d'une maquette locale a un vrai site professionnel avec commandes reelles, espace admin securise, suivi des employes, SMS et paiement apres validation.

## Fonctionnement client cible
1. Le client choisit ses produits
2. Il envoie sa demande avec telephone + adresse + date souhaitee
3. Il recoit un SMS de confirmation de reception
4. Un admin ou employe traite la commande
5. Si acceptee :
   - SMS + mail de validation
   - lien de paiement
   - delai de paiement
6. Si refusee :
   - SMS + mail de refus
   - motif personnalise

## Fonctionnement admin cible

### Admin principal
- cree les comptes employes
- supprime ou desactive un compte
- voit qui a traite chaque commande
- voit l'historique des actions
- archive ou supprime les anciennes commandes affichees
- accede aux statistiques annuelles

### Employe
- consulte les commandes
- accepte ou refuse selon ses droits
- doit saisir un motif de refus
- toutes ses actions sont historisees

## Technologies conseillees
- Frontend: Next.js
- Base de donnees: Supabase
- Auth: Supabase Auth
- SMS: Twilio ou OVH SMS
- Mail: Brevo ou Resend
- Paiement: Stripe Payment Links
- Dashboard: espace admin prive avec roles

## Tables de base de donnees conseillees

### users
- id
- full_name
- email
- role (owner, manager, employee)
- active
- created_at

### products
- id
- name
- slug
- category
- description
- price_from
- visible
- seasonal
- created_at

### orders
- id
- customer_name
- customer_email
- customer_phone
- delivery_address
- requested_date
- status
- estimated_total
- final_total
- refusal_reason
- accepted_by
- refused_by
- payment_link
- payment_deadline
- created_at
- updated_at

### order_items
- id
- order_id
- product_id
- product_name_snapshot
- quantity
- unit_price_snapshot

### order_events
- id
- order_id
- actor_user_id
- event_type
- notes
- created_at

### sms_logs
- id
- order_id
- phone
- template
- status
- provider_message_id
- created_at

## Pages a prevoir

### Site public
- Accueil
- Catalogue
- Produit / details
- Panier / demande
- Confirmation
- Mentions / contact

### Admin
- Connexion
- Tableau de bord
- Commandes
- Detail commande
- Produits
- Employes
- Historique
- Statistiques
- Parametres

## Statistiques annuelles
- nombre de commandes par mois
- chiffre d'affaires estime et confirme
- commandes acceptees / refusees
- produits les plus demandes
- periodes fortes de l'annee
- employe le plus actif

## Personnalisation prevue
- couleurs / logo / polices
- categories de produits
- regles de delai minimum
- zone de livraison
- frais de livraison
- textes SMS / mails
- regles de paiement

## Priorite de construction

### Phase 1
- site public pro
- base de donnees
- espace admin securise
- commandes reelles
- paiement encore facultatif a cette etape

### Phase 2
- SMS automatiques
- liens de paiement
- historique des actions
- roles employes

### Phase 3
- statistiques annuelles
- archivage avance
- gestion saisonniere
- exports

## Base deja preparee dans le dossier du projet
- `V2-SETUP.md`
- `supabase-schema-v2.sql`
- `supabase-rls-v2.sql`
- `env.v2.example`
- `PAYMENT-OPTIONS.md`
