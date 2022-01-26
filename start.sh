#!/bin/bash

echo "Lancement de l'API"
node ./api/app.js&
echo "API lancée"
echo "Lancement du serveur"
node app.js&
echo "C'est bon !"
