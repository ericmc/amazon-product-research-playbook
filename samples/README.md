# Sample CSV Files for Testing Import

This directory contains sample CSV files that demonstrate the expected format for importing data from different Amazon research tools.

## Files Included

### jungle-scout-sample.csv
Format typical of Jungle Scout exports with columns:
- Product Name
- Monthly Revenue  
- Search Volume
- Keyword
- Competition Score (0-100)
- FBA Fees
- BSR (Best Seller Rank)

### helium10-sample.csv  
Format typical of Helium 10 exports with columns:
- ASIN
- Product Title
- Brand
- Keyword
- Search Volume
- Revenue
- Units Sold
- Price
- Competition (Text: Low/Medium/High)

## How to Test Import Mapping

1. Go to the **Import** page in the application
2. Copy and paste the contents of either sample file into the text area
3. Click "Import" to see the field mapping interface
4. Map the CSV columns to the application's expected fields:
   - Product Name → Product Name
   - Monthly Revenue/Revenue → Revenue
   - Search Volume → Demand
   - Competition Score/Competition → Competition
   - etc.

## Expected Field Mappings

The application expects these core fields:
- **Product Name**: Product identifier
- **Revenue**: Monthly revenue in USD
- **Demand**: Search volume or demand metric
- **Competition**: Competition level (0-100 scale)
- **Barriers**: Market barriers (0-100 scale)
- **Seasonality**: Seasonality risk (0-100 scale)

## Notes

- The import system is flexible and can handle different column names
- Competition values will be normalized to 0-100 scale if needed
- Missing fields can be filled in manually during the scoring process
- Revenue values should be in USD (monthly basis preferred)