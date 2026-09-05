# Data Ingestion Scripts (Piyush)

Placeholder for scripts that pull and normalize:
- Census 2027 data (where officially published) + Census 2011 fallback
- MoSPI, Agriculture Dept., Animal Husbandry Dept. datasets
- State/District statistical reports, NABARD, RBI, mandi/market data
- **GST registration/cancellation data and the Udyam registration portal**
  (new — added as a proxy signal for fast business churn; see refresh
  strategy below). Alongside OSM/Places, this is now a documented source
  for Module 3 (Competitor Mapping).

Per the team's data-source-hierarchy decision, prioritize official
sources over Kaggle/secondary datasets, and record source + date/year +
geographic granularity for every dataset ingested. Output should feed
`ml_service/app/data/` in a format `location_intelligence.py` can consume.

## Data Refresh Strategy (architectural rule — not just a suggestion)

Different data changes at different rates. Treating all of it as "refresh
whenever we get around to it" is what causes census-staleness problems.
The rule:

| Data | Refresh strategy | Enforced in |
|---|---|---|
| Population / purchasing power (Census) | Annual interpolation between census years using state growth rates — **never wait for the literal next census.** See `ml_service/app/utils/population_interpolation.py`. | Module 1 |
| Competitor existence/count | Quarterly re-scrape, independent of the census cycle | Module 3 |
| Fast churn (shop opened/closed) | GST registration/cancellation data or the Udyam registration portal as a proxy signal, plus field corrections (`server/src/services/fieldCorrections.js`) for anything the registration feeds miss | Module 3 |

If you're building or touching Module 1 or Module 3's data pipeline,
this table is the contract you're implementing against — a data source
that doesn't fit one of these rows needs a row added here first, not a
one-off refresh schedule invented on the spot.

