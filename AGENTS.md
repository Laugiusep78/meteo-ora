# Regole del progetto

## Workflow Git automatico

- Dopo aver completato una modifica richiesta dall'utente, considera la modifica approvata salvo indicazioni contrarie.
- Esegui automaticamente:
  1. `git add -A`
  2. `git commit -m "<messaggio descrittivo in italiano>"`
  3. `git push origin main`
- Non chiedere conferma prima del push: l'utente ha autorizzato l'upload automatico delle modifiche.
- Se il push fallisce, riporta l'errore e spiega come risolverlo.
- Non usare `git push --force` e non riscrivere la cronologia senza richiesta esplicita.

## Repository

- Remote: https://github.com/Laugiusep78/meteo-ora
- Branch: `main`

## Nota sull'ambiente

`git` non è installato nel PATH di sistema. Usa il binario incluso in GitHub Desktop:

```bash
GITROOT=$(dirname "$(dirname "$(find /var/lib/flatpak/app/io.github.shiftey.Desktop -type f -path '*/resources/app/git/bin/git' | head -1)")")
export GIT_EXEC_PATH="$GITROOT/libexec/git-core"
export GIT_TEMPLATE_DIR="$GITROOT/share/git-core/templates"
"$GITROOT/bin/git" status
```

Il credential helper per GitHub è già configurato tramite `gh`.
