## Sémaphore

Service de sonnette connectée

Cette version est une amélioration de celle de 2018. La sécurité (grâce à l'API et aux sessions), le design et les performances ont étés (grandement) améliorées. 
L'architecture de cette version est aussi complètement différente (NodeJS et NoSQL à la place de PHP et de SQL)

### Mise en place
Fonctionnne avec une base de données NoSQL (MongoDB) à travers une API (dossier ./api) qui donne accès à la gestion des utilisateurs, de leur session de connexion, des posts et des images de fond
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
Ou
```shell
$ ./start.sh
```

### Lancement avec Docker

Le projet a été conteneurisé dans une image Docker pour permettre son déploiement rapide.
Étant donné qu'il y'a 3 services différents qui tournent en même temps pour l'exécution du programme (le serveur web, l'API et MongoDB), les différentes images on été compilées avec Docker compose.
Pour lancer les conteneurs, il suffit d'aller à la racine du projet et de lancer la commande
```shell
docker compose build
```
suivie de 
```shell
docker compose up -d
```
Des volumes on été utilisé pour permettre la sauvegarde des données (db mongo) et des backgrounds

### Configuration

Le serveur web tourne sur le port 80 et l'API sur le port 2021. 
Le service mongo étant utilisé uniquement en interne pour l'API, son port (27017) n'a pas été exposé.

L'ip de la machine exécutant le service doit être spécifié dans le champs "ip" du fichier `./utils/config.js` (ainsi que le port si celui-ci est modifié), attention il s'agit bien de l'ip de la machine et pas du conteneur !

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
- [ ] Ajouter un nom de domaine à la machine dans le DNS du réseau local pour ne plus avoir à jouer avec l'IP dans le fichier `utils/config.js`

### Erreurs possibles
- Le client ne se met pas à jour: Vérifier que l'adresse IP utilisée pour connecter le socket est bien celle du serveur
- Crash du client: Vérifier que l'API ne s'est pas arrêtée, si c'est le cas, la relancer avec `docker compose up -d`
