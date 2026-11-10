# Regole del progetto

## Percorso

Questo progetto vive in `/home/giu/progetti/meteo-ora/`.
Non è più in `/home/giu/meteo`: i percorsi vecchi vanno considerati obsoleti.

## Workflow Git automatico

- Dopo aver completato una modifica richiesta dall'utente, considera la modifica
  approvata salvo indicazioni contrarie.
- Esegui automaticamente:
  1. `git add -A`
  2. `git commit -m "<messaggio descrittivo in italiano>"`
  3. `git push origin main`
- Non chiedere conferma prima del push: l'utente ha autorizzato l'upload automatico
  delle modifiche.
- Se il push fallisce, riporta l'errore e spiega come risolverlo.
- Non usare `git push --force` e non riscrivere la cronologia senza richiesta esplicita.

## Repository

- Remote: <https://github.com/Laugiusep78/meteo-ora>
- Branch: `main`
- Visibilità: pubblica

## Ambiente

`git` non è nel PATH di sistema: usa il wrapper in user-space.

```bash
cd /home/giu/progetti/meteo-ora
git --version        # → 2.25.1, wrapper ~/.local/bin/git
git status
```

Se `git` non fosse disponibile, il wrapper usa Git 2.25.1 estratto in
`~/.local/git-root`. Il credential helper per GitHub è configurato tramite `gh`
(`~/.local/bin/gh`).

## Avvio in locale

```bash
cd /home/giu/progetti/meteo-ora
python3 -m http.server 8000
# aprire http://localhost:8000
```

La geolocalizzazione richiede `localhost` o HTTPS.
