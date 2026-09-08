# UdyamSaarthi-AI Data Ingestion

The ingestion layer converts approved, normalized source data into the
location evidence dataset used by the ML service.

## Source priority

Data should be preferred in this order:

1. Official Government Data
2. Verified / Recent Local Data
3. Research / Secondary Data
4. Assumption / Model Estimate

## Important coverage rule

No dataset should be described as representing every business or household
unless the underlying methodology actually provides complete coverage.

For example:

- Udyam data represents registered MSMEs.
- Survey data represents statistical estimates and should not be interpreted
  as a complete local business directory.
- Census data provides population/demographic information for its applicable
  reference period.
- Local field data may improve visibility into businesses missing from online
  or administrative datasets.

## Required evidence fields

Every ingested record should preserve:

- village
- block
- district
- state
- source
- dataYear
- lastUpdated
- geographicMatch
- coverage
- dataConfidence
- dataNotes

## CSV format

The normalized CSV should contain:

```text
village
block
district
state
consumerBase
purchasingPowerIndex
existingBusinessDensity
marketsAndHaats
distributionChannels
livestockIndex
radiusKm
source
dataYear
lastUpdated
dataConfidence
geographicMatch
coverage
dataNotes