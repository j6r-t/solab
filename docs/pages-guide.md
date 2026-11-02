# Guide des pages de Solab

Ce document décrit **chaque page de l'application** : à quoi elle sert, ce qu'on peut y faire, et pourquoi elle est utile. Il est écrit pour l'équipe de la maison, sans jargon technique.

## Qui voit quoi ?

Solab connaît trois profils (rôles). Le menu s'adapte automatiquement au profil de connexion :

| Rôle | Qui | Pages visibles |
|---|---|---|
| **Admin** | Sofien (gérant) | **Tout** : toutes les pages boutique + toutes les pages atelier + le Journal d'audit |
| **Boutique** | La maman (comptoir) | Accueil, Clients, Médecins, Stock, Commandes, Facturation, Chèques, Factures fournisseur, Fournisseurs, Code QR, Import, Rapports, Paramètres |
| **Atelier** | Le papa (labo) | Accueil, Travaux atelier, Verres atelier, Opticiens partenaires, Factures, Fournisseurs, Rapports, Paramètres |

Sur mobile, seules 4 pages principales sont affichées en bas de l'écran (le reste est sous le bouton « Plus ») :
- **Admin** : Tableau de bord, Commandes, Chèques, Stock
- **Boutique** : Tableau de bord, Clients, Stock, Commandes
- **Atelier** : Tableau de bord, Travaux atelier, Verres atelier

> À noter : le compte **Admin voit les tableaux de bord et rapports des deux mondes** (boutique + atelier) sur la même page — pratique pour tout surveiller d'un seul coup d'œil.

---

## Pages communes à tous les rôles

### Tableau de bord
**C'est quoi ?** La première page à l'ouverture : un résumé du moment, différent selon le rôle.

**Ce qu'on peut faire :**
- *Version boutique (et admin)* : chiffre d'affaires du mois, nombre de clients, ventes du jour, articles en stock bas, réparations en attente, total d'articles au catalogue. En dessous, la liste des **commandes prêtes à récupérer** avec leur montant — on peut ouvrir chaque commande et la marquer « récupérée » directement.
- *Version atelier* : la **file d'attente** (ordres en attente / en cours, avec les retards signalés en rouge), les travaux **prêts à livrer** (et chez quel opticien), les **verres en stock bas**, plus une ligne discrète avec la casse du mois et le délai moyen. Chaque chiffre est cliquable et ouvre la liste déjà filtrée.
- *Admin* : les deux s'affichent l'un sous l'autre, avec des raccourcis (nouvelle commande, travaux atelier, opticiens partenaires).

**Pourquoi c'est utile :** c'est le « poste de pilotage » de la journée — on voit immédiatement ce qui attend, ce qui est en retard et ce qui est prêt à rendre au client, sans fouiller dans les menus.

### Rapports
**C'est quoi ?** Les statistiques de l'activité, avec un sélecteur de période (aujourd'hui / cette semaine / ce mois / cette année / tout). Le contenu dépend du rôle : rapports boutique pour admin et boutique, rapports atelier pour atelier.

**Ce qu'on peut faire (version boutique) :** chiffre d'affaires, bénéfice, panier moyen, comparaison avec la période précédente ; revenus par type de vente et commandes par statut ; meilleurs produits et top clients ; clients fidèles et nouveaux clients ; ventes par mode de paiement ; créances (impayés) ; santé du stock (ruptures, stock bas, stock dormant) ; top médecins prescripteurs ; ventes par jour de la semaine et par heure ; concentration du chiffre d'affaires ; chèques en attente par banque ; soldes fournisseurs ; liste de réapprovisionnement.

**Ce qu'on peut faire (version atelier) :** charge de travail et arriérés (avec leur ancienneté) ; délai moyen de traitement ; taux de casse ; revenu par opticien partenaire ; répartition interne / opticiens ; verres consommés et casse par type de verre ; ordres par magasin ; fiche de chaque partenaire (dette, dernière activité) ; soldes fournisseurs et couverture de stock.

**Pourquoi c'est utile :** au lieu de « sentir » que ça va, on voit les chiffres : quelles ventes marchent, qui doit de l'argent, quels verres roulent, et si le mois est meilleur que le précédent.

### Paramètres
**C'est quoi ?** La page de réglages personnels et des petites listes utilisées dans les formulaires.

**Ce qu'on peut faire :**
- *Tous* : changer la langue (français / anglais), l'apparence (clair / sombre), son nom et son email, et son mot de passe.
- *Admin et atelier* : gérer les **marques de verres** (Essilor, Zeiss…) et les **services de réparation** avec leur prix par défaut (ajustage, remontage…).
- *Admin seulement* : gérer la liste des **banques** (utilisée pour les chèques et traites), régler la **marge par défaut** (le prix de vente suggéré sur les factures d'achat = prix d'achat + ce pourcentage), et voir l'état de connexion du système.

**Pourquoi c'est utile :** on personnalise une fois les listes qu'on utilise tous les jours, et après plus besoin de retaper « BIAT » ou « Ajustage de monture » à chaque saisie.

---

## Pages Boutique (visibles aussi par l'admin)

### Clients
**C'est quoi ?** Le carnet d'adresses des clients du magasin.

**Ce qu'on peut faire :** créer un client (nom, téléphone, adresse, date de naissance, notes…), rechercher par nom ou téléphone, modifier, supprimer, exporter la liste en CSV. La fiche client regroupe son historique de commandes et **ses ordonnances** (avec les valeurs œil droit / œil gauche), qu'on peut ajouter ou corriger.

**Pourquoi c'est utile :** quand un client rappelle, on retrouve en deux secondes son numéro, son ordonnance et ce qu'il a acheté — fini les cahiers.

### Médecins
**C'est quoi ?** L'annuaire des médecins ophtalmologues qui prescrivent aux clients.

**Ce qu'on peut faire :** ajouter un médecin (nom, téléphone, spécialité), le lier aux ordonnances, et voir la liste de ses patients.

**Pourquoi c'est utile :** on sait quel médecin a prescrit quoi — pratique pour retrouver une ordonnance ou voir quels clients viennent de chez lui. *Page facultative : si on ne renseigne pas le médecin sur les ordonnances, elle reste simplement vide.*

### Stock
**C'est quoi ?** L'inventaire des produits du magasin : montures, lentilles, verres, accessoires, nettoyants.

**Ce qu'on peut faire :** créer et modifier des produits (marque, modèle, référence, prix d'achat et de vente, quantité, fournisseur, et pour les verres : type, matière, traitement, épaisseur, SPH/CYL/ADD), filtrer finement (y compris par plage de correction), voir d'un coup d'œil ce qui est en rupture ou en stock bas, et **imprimer une étiquette QR** à coller sur l'article.

**Pourquoi c'est utile :** on sait toujours ce qu'il reste en rayon et ce qu'il faut recommander, et la valeur totale du stock est calculée automatiquement.

### Commandes
**C'est quoi ?** Le cœur du comptoir : toutes les ventes en cours, de la commande à la livraison.

**Ce qu'on peut faire :**
- Créer une commande de 3 types : **Monture + Verres** (vente avec ordonnance et montage), **Remontage** (nouveaux verres sur la monture du client), ou **Vente directe** (accessoires, lentilles, lunettes prêtes — payées tout de suite).
- Saisir ou **photographier l'ordonnance** : la photo est jointe à la commande pour référence (la lecture automatique des valeurs sur la photo existe mais n'est pas fiable actuellement — vérifiez et corrigez toujours les valeurs à la main).
- Scanner l'**étiquette QR** d'un article pour l'ajouter à la commande ; l'app propose même les verres du stock atelier compatibles avec l'ordonnance.
- Encaisser en plusieurs fois : espèces, carte, **chèque ou traite** (avec numéro de banque et date d'échéance), acompte puis solde.
- Suivre le statut : *en attente → prêt → récupéré*, appliquer une remise, imprimer la facture. Une commande supprimée remet les articles en stock.

**Pourquoi c'est utile :** plus de carbone ni de cahier : chaque commande a son statut, son solde et son historique de paiements, et le client n'est jamais « perdu » dans le système.

### Facturation
**C'est quoi ?** La liste de toutes les ventes terminées ou en cours, vue « tickets de caisse ».

**Ce qu'on peut faire :** rechercher une facture, voir son statut de paiement, imprimer le reçu ou la facture, l'exporter en PDF, faire une **vente rapide** (paiement intégral en une fois), et afficher un rapport de caisse sur une période (jour, semaine, mois) avec le détail et les totaux.

**Pourquoi c'est utile :** c'est le tiroir-caisse de l'app : en fin de journée ou de mois, on imprime le récapitulatif des ventes sans rien recalculer à la main.

### Chèques et traites
**C'est quoi ?** Le suivi de tous les chèques et traites (clients et fournisseurs), pour ne jamais oublier une échéance.

**Ce qu'on peut faire :** voir chaque instrument avec son numéro, sa banque, son montant, sa date d'échéance et son statut (en attente, déposé, encaissé, rejeté, en retard) ; filtrer par statut ou par type ; marquer un chèque **encaissé / payé / rejeté** (avec confirmation) ; sélectionner plusieurs chèques en attente pour les traiter en lot. Une alerte signale les chèques qui arrivent à échéance, et une traite ne peut pas être encaissée avant sa date.

**Pourquoi c'est utile :** c'est l'argent « qui dort » : la page dit exactement combien va rentrer et quand, et évite le chèque oublié ou le rejeté passé inaperçu.

### Factures fournisseur
**C'est quoi ?** Les achats : chaque facture reçue d'un fournisseur de montures, lentilles ou verres.

**Ce qu'on peut faire :** saisir une facture d'achat ligne par ligne — les **produits sont créés automatiquement dans le stock** avec leur prix d'achat, et le prix de vente est **suggéré** à partir de la marge par défaut (réglable dans Paramètres). Pour les verres atelier, les blancs sont créés automatiquement aussi. On peut imprimer les étiquettes QR des nouveaux articles directement après la saisie, suivre ce qui est payé ou non, et télécharger la facture en PDF.

**Pourquoi c'est utile :** la saisie d'une livraison remplit le stock toute seule — plus besoin de recréer chaque article à la main, et on sait ce qu'on doit encore à chaque fournisseur.

### Fournisseurs
**C'est quoi ?** L'annuaire des fournisseurs (montures, verres, lentilles…), pour le magasin et pour l'atelier.

**Ce qu'on peut faire :** ajouter un fournisseur (téléphone, adresse, email, matricule fiscal), voir les produits qu'il a fournis (vendus / invendus), exporter la liste en CSV.

**Pourquoi c'est utile :** tous les contacts et leur matricule fiscal au même endroit, et on peut voir d'un coup d'œil ce qu'on a acheté chez lui.

### Code QR
**C'est quoi ?** Une petite page de recherche : on saisit (ou on passe au lecteur) le code d'une étiquette QR, et l'app affiche le produit correspondant (nom, marque, prix) ainsi que l'image de son QR.

**Ce qu'on peut faire :** taper ou scanner un code, voir la fiche du produit.

**Pourquoi c'est utile (et ses limites) :** honnêtement, **utilité limitée au quotidien**. Le vrai scan QR se fait déjà *à l'intérieur du formulaire de nouvelle commande* (le bouton caméra ajoute l'article scanné directement dans la vente), et la recherche du stock fait la même chose en tapant le nom. Cette page sert surtout à vérifier qu'une étiquette correspond bien au bon article, ou à retrouver un produit à partir d'un lecteur de codes branché en USB. Elle peut être ignorée sans rien perdre.

### Import
**C'est quoi ?** Un assistant pour récupérer d'un coup des listes de **clients** ou de **fournisseurs** depuis un fichier Excel/CSV (par exemple l'ancien carnet d'adresses ou une exportation d'un autre logiciel).

**Ce qu'on peut faire :** choisir le type (clients ou fournisseurs), déposer le fichier, l'app **reconnaît automatiquement les colonnes** (nom, téléphone, matricule fiscal…) et montre un aperçu avec les doublons détectés avant d'importer. Les lignes en erreur sont signalées sans bloquer les autres.

**Pourquoi c'est utile :** au démarrage, ça évite de ressaisir des centaines de fiches à la main. Une fois la migration faite, la page peut dormir — elle ne gère que clients et fournisseurs, pas le stock.

---

## Pages Atelier (visibles aussi par l'admin)

### Travaux atelier
**C'est quoi ?** La liste de travail du labo : tous les montages et réparations, aussi bien pour les clients du magasin que pour les opticiens partenaires.

**Ce qu'on peut faire :** voir chaque ordre avec son statut (*en attente → en cours → terminé → livré*), sa date de livraison prévue (les retards sont visibles), le client ou l'opticien concerné. Créer un ordre directement : choisir l'opticien, les services (ajustage, montage…), la source des verres (notre stock ou fournis par l'opticien), saisir ou photographier l'ordonnance (lire la photo ne dispense pas de vérifier les valeurs à la main). Dans le détail : **assigner les verres du stock** (œil droit / gauche), **déclarer une casse** (quel œil, avec ou sans verre de remplacement prélevé du stock — à la charge de l'atelier, sans changer la facture), et enregistrer les paiements.

**Pourquoi c'est utile :** c'est la feuille de route du papa : la file d'attente du jour, ce qui est en retard, et la traçabilité des verres utilisés et des casses — plus de post-it sur l'établi.

### Verres atelier
**C'est quoi ?** Le stock des **blancs de verres** du labo, classés par correction (SPH / CYL), épaisseur, type et marque.

**Ce qu'on peut faire :** ajouter, modifier ou supprimer un verre (marque, type, matière, traitement, épaisseur, correction, coût, prix de vente, quantité, fournisseur), rechercher par marque ou épaisseur, voir les références en stock bas (quantité ≤ 3).

**Pourquoi c'est utile :** quand une commande arrive, on sait tout de suite si le verre existe au labo et où il est — et on réapprovisionne avant la rupture.

### Opticiens partenaires
**C'est quoi ?** Le carnet des opticiens de la région pour lesquels l'atelier travaille.

**Ce qu'on peut faire :** ajouter un opticien (nom, téléphone, adresse, notes), le modifier, le supprimer, rechercher dans la liste.

**Pourquoi c'est utile :** les travaux pour les opticiens sont rattachés à cette liste, ce qui permet ensuite de leur établir des factures et de suivre ce que chacun doit. *Page simple : c'est un annuaire, le suivi financier se fait dans la page « Factures ».*

### Factures
**C'est quoi ?** Le suivi financier de l'atelier, en trois onglets : ce que les opticiens doivent, ce qu'on doit aux fournisseurs, et les chèques qui arrivent à échéance.

**Onglet Opticiens :** pour chaque travail fait pour un opticien, une **facture est créée automatiquement**. On peut la consulter (aperçu), l'imprimer, enregistrer les paiements (total ou partiel), et surtout **regrouper plusieurs factures impayées d'un même opticien en une seule facture groupée** — pratique pour encaisser d'un seul montant au lieu de cinq.

**Onglet Fournisseurs :** la même chose à l'envers : les factures des fournisseurs de l'atelier, avec paiements et regroupement en facture groupée.

**Onglet Échéances :** les chèques et traites liés aux factures opticiens et fournisseurs, triés par segments (à venir, en retard, encaissés, rejetés). On marque chaque instrument **encaissé / payé / rejeté** et la facture liée est mise à jour automatiquement.

**Pourquoi c'est utile :** c'est la comptabilité du labo sans comptable : qui doit quoi, ce qui est réglé, et quels chèques attendent à la banque — avec les factures prêtes à imprimer pour les partenaires.

> À ne pas confondre : l'onglet **Échéances** ne concerne que les chèques des factures atelier/opticiens et fournisseurs. Les chèques des **clients du magasin** se suivent dans la page **« Chèques et traites »** du menu Ventes.

---

## Page Admin uniquement

### Journal d'audit
**C'est quoi ?** L'historique de toutes les actions effectuées dans l'application : qui a créé, modifié ou supprimé quoi, et quand.

**Ce qu'on peut faire :** filtrer par type d'action, par type d'élément (client, commande…) et par dates, ouvrir le détail de chaque entrée, naviguer page par page.

**Pourquoi c'est utile :** en cas de doute (« qui a changé ce prix ? », « cette commande a disparu ? »), la réponse est là. C'est une page de **vérification**, pas de travail quotidien — la plupart du temps elle reste vide d'usage, et c'est très bien comme ça.

---

## Résumé : les pages et leur rôle en une phrase

| Page | Rôles | En une phrase |
|---|---|---|
| Tableau de bord | tous | Le résumé du moment : ce qui attend, ce qui est prêt, ce qui est en retard |
| Clients | admin, boutique | Le carnet d'adresses avec historique et ordonnances |
| Médecins | admin, boutique | L'annuaire des prescripteurs et de leurs patients |
| Stock | admin, boutique | L'inventaire du magasin avec étiquettes QR |
| Commandes | admin, boutique | Créer et suivre chaque vente, de l'ordonnance à la récupération |
| Facturation | admin, boutique | Les tickets de caisse et le rapport de caisse par période |
| Chèques et traites | admin, boutique | Ne jamais oublier une échéance de chèque client ou fournisseur |
| Factures fournisseur | admin, boutique | Saisir un achat et remplir le stock automatiquement |
| Fournisseurs | tous | L'annuaire des fournisseurs et leurs produits |
| Code QR | admin, boutique | Recherche d'un produit par son code QR (utilité limitée) |
| Import | admin, boutique | Récupérer en masse clients et fournisseurs depuis un CSV |
| Travaux atelier | admin, atelier | La file de travail du labo : montages, réparations, casses |
| Verres atelier | admin, atelier | Le stock des blancs de verres par correction |
| Opticiens partenaires | admin, atelier | L'annuaire des opticiens clients du labo |
| Factures | admin, atelier | L'argent dû et à recevoir : opticiens, fournisseurs, échéances |
| Rapports | tous | Les chiffres de l'activité, boutique ou atelier selon le rôle |
| Paramètres | tous | Langue, apparence, mot de passe et listes (banques, services, marge) |
| Journal d'audit | admin | Qui a fait quoi, et quand (vérification) |
