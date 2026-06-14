Maison Waret - Site internet V1
================================

Cette premiere version est une maquette fonctionnelle sans installation.

Fichiers principaux
- index.html : page principale du site
- admin.html : tableau de bord local de demonstration
- login.html : connexion et creation du compte admin local
- styles.css : design du site
- app.js : catalogue, panier, commandes et gestion locale
- site-config.js : configuration facile a modifier pour le nom, les textes et les produits
- PLAN-V2-PRO.md : plan de la future version pro
- V2-SETUP.md : point de depart concret pour la V2
- supabase-schema-v2.sql : base de donnees V2
- supabase-rls-v2.sql : droits et securite V2
- env.v2.example : variables d'environnement a prevoir
- PAYMENT-OPTIONS.md : aide pour choisir le paiement plus tard

Comment tester
1. Ouvrir index.html dans un navigateur
2. Ajouter des produits au panier
3. Envoyer une demande de commande
4. Ouvrir login.html pour creer le premier compte admin principal
5. Se connecter puis ouvrir admin.html
6. Accepter ou refuser les commandes dans l'admin
7. Archiver ou supprimer les anciennes commandes
8. Creer des comptes employes ou manager depuis l'admin principal

Important
- Cette version stocke tout en local dans le navigateur
- Il n'y a pas encore de vraie base de donnees
- Il n'y a pas encore de mails automatiques
- Il n'y a pas encore de paiement en ligne
- Le compte admin actuel est une demonstration locale

Personnalisation rapide
- Ouvrir site-config.js
- Modifier le nom, les textes, les produits et certaines regles sans toucher au reste du code

Fonctions V1 deja presentes
- premier compte admin principal via login.html
- comptes manager / employe crees ensuite depuis l'admin
- historique local des actions admin
- motif obligatoire lors d'un refus de commande
- archivage des commandes et suppression locale
- vue annuelle simple des commandes
- suivi de qui a accepte ou refuse une commande

Etape suivante conseillee
- Migrer vers une version pro avec:
  - backend
  - base de donnees
  - mails automatiques
  - paiement apres validation
  - espace admin securise
  - gestion zone de livraison

Passage V2 recommande
1. Lire V2-SETUP.md
2. Creer le projet Supabase
3. Executer supabase-schema-v2.sql
4. Executer supabase-rls-v2.sql
5. Completer env.v2.example
6. Choisir le paiement plus tard si besoin
