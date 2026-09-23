# Stack backend auto-hébergée (production locale)

Ce dossier contient la configuration Docker Compose qui fait tourner le backend Nhost
(Postgres, Hasura, Auth, Storage, Functions, Traefik, ...) sur cette VM de façon pérenne.

## Ne plus utiliser `nhost up` / `nhost down`

**Important : `nhost up` et `nhost down` ne doivent plus être utilisés pour gérer cette stack.**

`nhost up` régénère `.nhost/docker-compose.yaml` à chaque lancement et **écrase la
configuration SMTP** (il force `AUTH_SMTP_HOST=mailhog`, quelle que soit la config
`[provider.smtp]` de `nhost/nhost.toml`). C'est un comportement du CLI pensé pour le
développement local (capturer les emails dans Mailhog), pas pour une stack de production.

`docker/docker-compose.prod.yaml` a été généré une fois à partir de `.nhost/docker-compose.yaml`,
puis modifié à la main (SMTP Free.fr, project name `rolebase` pour réutiliser les volumes/réseau
existants). C'est désormais la seule source de vérité pour lancer le backend.

## Commandes

Depuis la racine du repo :

```bash
# Démarrer (ou redémarrer) la stack
docker compose -f docker/docker-compose.prod.yaml up -d

# Arrêter la stack (les volumes, dont les données Postgres, sont conservés)
docker compose -f docker/docker-compose.prod.yaml down

# Voir les logs d'un service
docker compose -f docker/docker-compose.prod.yaml logs -f auth
```

Le fichier déclare `name: rolebase` en tête, ce qui garantit que les volumes Docker
(`rolebase_pgdata_main`, `rolebase_minio_main`, etc.) et le réseau (`rolebase_default`)
déjà créés par les précédents lancements `nhost up` sont bien réutilisés — aucune perte
de données.

## Secrets

Les valeurs sensibles (mot de passe SMTP) sont dans `docker/.env` (ignoré par git, jamais
commité), référencées dans le compose via `${SMTP_PASS}`. Le fichier `.env` est chargé
automatiquement par `docker compose` car il se trouve dans le même dossier que le fichier
compose ciblé par `-f`.

## Si `nhost.toml` change

Toute modification de `nhost/nhost.toml` (permissions, migrations, config Hasura/Auth...)
doit être répercutée manuellement dans `docker/docker-compose.prod.yaml` — ce fichier n'est
plus régénéré automatiquement. Pour une modification de config Hasura pure (permissions,
metadata), le plus simple reste `nhost/metadata/` + le skill `apply-hasura-metadata`, qui
s'applique directement à l'instance Hasura en cours d'exécution sans redémarrage.

## Démarrage automatique (backend, webapp, collab)

La stack Nhost (`docker compose -f docker/docker-compose.prod.yaml up -d`) redémarre
seule après un reboot : tous ses conteneurs sont en `restart: always`, et le service
`docker` est activé au boot (`systemctl enable docker`).

Le **backend** (`packages/backend`, API tRPC/GraphQL) et le **webapp** (`packages/webapp`,
build statique servi par `vite preview`) ne sont pas conteneurisés : ils tournent en
process direct, gérés par systemd via `docker/systemd/rolebase-backend.service` et
`docker/systemd/rolebase-webapp.service`. Ces fichiers contiennent le chemin absolu vers
le binaire Node géré par nvm et l'utilisateur système (`raoul`) — à adapter s'ils changent.

```bash
sudo cp docker/systemd/rolebase-backend.service docker/systemd/rolebase-webapp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now rolebase-backend rolebase-webapp
```

Le **collab** (`packages/collab`, serveur yjs) est conteneurisé (`packages/collab/Dockerfile`,
`npm run docker:build` puis `npm run docker:run`) avec `--restart always` et un volume
(`rolebase_collab_data`) pour la persistance des documents.

```bash
journalctl -u rolebase-backend -f   # logs du backend
journalctl -u rolebase-webapp -f    # logs du webapp
```
