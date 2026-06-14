# Maison Waret - Choix de paiement V2

## Situation actuelle
Tu m'as dit que tu ne sais pas encore quoi choisir pour le paiement.

Ce n'est pas bloquant.
La V2 peut etre construite tout de suite avec un paiement laisse en option.

## Mon conseil simple
Commencer avec :
- validation manuelle
- commande acceptee ou refusee
- paiement manuel au debut

Puis plus tard, si tu veux :
- on ajoute un lien de paiement apres acceptation

## Options possibles

### Option 1 - Pas de paiement en ligne tout de suite
Le plus simple pour commencer.

#### Avantages
- rapide a mettre en place
- aucun frais technique au debut
- tres simple pour tester le vrai flux client

#### Inconvenients
- plus manuel
- pas de paiement automatise

#### Bon choix si
- tu veux d'abord valider le fonctionnement du site
- tu veux garder la main sur chaque commande

### Option 2 - Stripe Payment Links
La meilleure option si tu veux quelque chose de propre et simple plus tard.

#### Avantages
- tres connu
- liens de paiement faciles a envoyer apres acceptation
- bon suivi du statut de paiement
- s'integre bien avec une V2 Next.js + Supabase

#### Inconvenients
- creation du compte Stripe
- frais de transaction

#### Bon choix si
- tu veux envoyer un lien apres validation
- tu veux quelque chose de pro et evolutif

### Option 3 - Paiement externe plus tard
Exemple : virement, lien manuel, autre prestataire.

#### Avantages
- souple
- tu peux changer d'outil plus tard

#### Inconvenients
- moins integre
- plus de suivi manuel

## Recommendation
Si tu veux mon vrai conseil :
1. on construit la V2 sans paiement bloque
2. on met `payment_mode = manual`
3. quand tu es pret, on ajoute Stripe Payment Links

## Conclusion
Le paiement n'a pas besoin d'etre decide maintenant.
Le plus important pour la V2, c'est :
- les commandes reelles
- les comptes admin / employes
- les SMS / mails
- l'historique des actions
- la base propre
