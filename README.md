## Sémaphore

Service de sonnette connectée

Cette version est une amélioration de celle de 2018. La sécurité (grâce à l'API et aux sessions), le design et les performances ont étés (grandement) améliorées. 
L'architecture de cette version est aussi complètement différente (NodeJS et NoSQL à la place de PHP et de SQL)

### Mise en place
Fonctionnne avec une base de données NoSQL (MongoDB) à travers une API (./api) qui donne accès à la gestion des utilisateurs, de leur session de connexion, des posts et des images de fond
#### Installation des dépendances
* MongoDB (créer une db "semaphore")
* Installer les dépendances NodeJS avec la commande `npm i` à la racine du dossier  

Pour lancer le projet:
```shell
$ sudo service mongo start
$ cd api # L'API se lance avant le programme
$ node app.js&
$ cd ../
$ node app.js&
```

### Technologies utilisées:
* NodeJS
* Express pour le routage
* EJS pour le formatage HTML
* MongoDB pour la base de données
* Multer pour le transfert HTTP et la sauvegarde des images sur le disque
* Socket.io pour le rafraichissement temps-réel des vues

### À faire
- [ ] Drag&Drop des posts dans la page de modification -> Trouver une façon optimale de stocker les préférences (serveur ou local) -> c'est loooourd
- [ ] Système de Permissions
- [ ] Système de modification de mot de passe

### Erreurs possibles
- Le client ne se met pas à jour: Vérifier que l'adresse IP utilisée pour connecter le socket est bien celle du serveur
- Crash du client: Vérifier que l'API ne s'est pas arrêtée, si c'est le cas, la relancer avec `node app.js`