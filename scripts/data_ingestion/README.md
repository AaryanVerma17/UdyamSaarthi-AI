# Data Ingestion Scripts (Piyush)

Placeholder for scripts that pull and normalize:
- Census 2027 data (where officially published) + Census 2011 fallback
- MoSPI, Agriculture Dept., Animal Husbandry Dept. datasets
- State/District statistical reports, NABARD, RBI, mandi/market data

Per the team's data-source-hierarchy decision, prioritize official
sources over Kaggle/secondary datasets, and record source + date/year +
geographic granularity for every dataset ingested. Output should feed
`ml_service/app/data/` in a format `location_intelligence.py` can consume.
