window.MAISON_WARET_CONFIG = {
  brand: {
    name: "Maison Waret",
    subtitle: "Patisserie artisanale",
    adminSubtitle: "Dashboard commandes",
    privateLabel: "Espace prive",
    heroEyebrow: "Commandes sur demande",
    heroTitle: "Boxes de viennoiseries, gateaux et douceurs selon vos envies.",
    heroText:
      "Maison Waret vous propose une commande simple en ligne. Vous choisissez vos produits, vous envoyez votre demande, puis je valide ou refuse selon les disponibilites, les delais et la livraison.",
    footerText:
      "Patisserie artisanale, commandes locales et creations sur demande."
  },
  ordering: {
    deliveryMode: "Livraison locale uniquement",
    validationText: "Validation manuelle de chaque commande",
    paymentText: "Paiement apres acceptation",
    minimumDelayDays: 2,
    minimumDelayLabel: "48h conseillees",
    productsLabel: "Boxes, gateaux, saisonnier"
  },
  admin: {
    loginPageName: "Maison Waret admin",
    loginDescription:
      "Cette page est separee du site client. Elle sert uniquement a la connexion du compte administrateur pour consulter et gerer les commandes."
  },
  products: [
    {
      id: "box-classique",
      name: "Box viennoiseries classique",
      category: "Box",
      description: "Assortiment de croissants, pains au chocolat et douceurs du moment.",
      price: 18.5
    },
    {
      id: "box-brunch",
      name: "Box brunch gourmande",
      category: "Box",
      description: "Selection plus genereuse pour les matins de fete ou les cadeaux gourmands.",
      price: 32
    },
    {
      id: "entremets",
      name: "Gateau entremets",
      category: "Gateau",
      description: "Base personnalisable selon vos envies, a confirmer apres validation.",
      price: 28
    },
    {
      id: "number-cake",
      name: "Number cake",
      category: "Commande speciale",
      description: "Ideal pour anniversaire ou evenement, decor et quantite sur demande.",
      price: 42
    },
    {
      id: "saisonnier",
      name: "Creation saisonniere",
      category: "Saisonnier",
      description: "Produit du moment selon la saison, les fetes et l'inspiration Maison Waret.",
      price: 16
    }
  ]
};
