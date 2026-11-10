# MeteoOra

Pagina statica in HTML, CSS e JavaScript per visualizzare il meteo attuale e la previsione della prossima ora alla propria posizione.

## Funzionalità

- Meteo attuale con temperatura, percepita, umidità, vento, precipitazioni e pressione.
- Previsione per la prossima ora piena con probabilità di pioggia e vento.
- Rilevamento della posizione tramite geolocalizzazione del browser.
- Ricerca di una città come alternativa alla geolocalizzazione.
- Tema automatico giorno/notte basato su alba e tramonto reali della località.
- Tema manuale (automatico, chiaro, scuro) con preferenza salvata.
- Registro orario salvato in `localStorage` con export CSV.
- Aggiornamento automatico ogni 10 minuti.
- Design responsive e accessibile.

## Avvio

La geolocalizzazione richiede un contesto sicuro (`localhost` o HTTPS):

```bash
cd meteo
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

## Dati

- [Open-Meteo](https://open-meteo.com/) per meteo attuale, previsioni orarie, alba/tramonto e ricerca città.
- [BigDataCloud](https://www.bigdatacloud.com/) per il reverse geocoding della posizione.

## Note

- Il registro orario funziona solo mentre la pagina è aperta: per un log continuo 24/7 servirebbe un backend.
- I dati sono salvati nel browser (`localStorage`), quindi non vengono condivisi tra dispositivi.

## Struttura

```
index.html
style.css
script.js
```
