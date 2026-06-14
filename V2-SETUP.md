# Maison Waret - Fondation V2

## Objectif
Poser une base propre pour passer de la V1 locale a une vraie V2 professionnelle, sans bloquer le projet sur un choix de paiement immediat.

## Decision prise pour l'instant
- commandes reelles : oui
- comptes admin / employes : oui
- base de donnees : oui
- SMS / mails : oui
- paiement en ligne : pas encore fige

## Strategie recommandee
On garde un systeme de validation manuelle :
1. le client envoie une demande
2. la commande arrive en statut `pending`
3. un admin ou employe l'accepte ou la refuse
4. si elle est acceptee :
   - soit tu envoies un lien de paiement
   - soit tu gardes un paiement manuel
5. toutes les actions sont historisees

## Fichiers ajoutes pour la V2
- `supabase-schema-v2.sql` : structure de la base
- `supabase-rls-v2.sql` : securite et droits d'acces
- `env.v2.example` : variables a prevoir
- `PAYMENT-OPTIONS.md` : choix possibles pour le paiement

## Architecture recommandee
- frontend : Next.js
- base et auth : Supabase
- mails : Brevo ou Resend
- SMS : Twilio ou OVH SMS
- paiement : plus tard, selon ton choix

## Workflow paiement sans decision definitive
Pour ne pas te bloquer, la base V2 est prevue pour 3 cas :

### Cas 1 - Pas de paiement en ligne au debut
- statut commande : `accepted`
- `payment_mode = manual`
- paiement a la livraison, au retrait ou par virement

### Cas 2 - Lien de paiement apres acceptation
- statut commande : `accepted`
- `payment_mode = link_after_acceptance`
- `payment_provider = stripe` par exemple
- `payment_link` rempli seulement quand tu valides la commande

### Cas 3 - Paiement hors site
- statut commande : `accepted`
- `payment_mode = external_checkout`
- tu peux envoyer un lien tiers plus tard

## Ordre de construction conseille
1. creer la base Supabase
2. brancher l'auth admin/employes
3. brancher les commandes reelles
4. brancher les SMS/mails
5. ajouter le paiement quand tu es decide

## Important
Le paiement n'est pas obligatoire pour lancer la V2.
Le plus important, c'est d'avoir :
- commandes reelles
- roles admin propres
- historique complet
- notifications
- donnees bien structurees
