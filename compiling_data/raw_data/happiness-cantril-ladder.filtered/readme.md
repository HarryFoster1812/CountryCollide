# Self-reported life satisfaction - Data package

This data package contains the data that powers the chart ["Self-reported life satisfaction"](https://ourworldindata.org/grapher/happiness-cantril-ladder?overlay=download-data&v=1&csvType=filtered&useColumnShortNames=false) on the Our World in Data website. It was downloaded on November 08, 2025.

### Active Filters

A filtered subset of the full data was downloaded. The following filters were applied:
overlay: download-data

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For normal countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The final column is the data column, which is the time series that powers the chart. If the CSV data is downloaded using the "full data" option, then the column corresponds to the time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data column is transformed depending on the chart type and thus the association with the time series might not be as straightforward.

## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

## Detailed information about the data


## Self-reported life satisfaction
Average of survey responses. The survey question asks respondents their current position on a hypothetical [ladder](#dod:cantril-ladder), where the best possible life for them is a 10, and the worst possible life is a 0.
Last updated: March 28, 2025  
Next update: March 2026  
Date range: 2011–2024  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Wellbeing Research Centre (2025) – with major processing by Our World in Data

#### Full citation
Wellbeing Research Centre (2025) – with major processing by Our World in Data. “Self-reported life satisfaction” [dataset]. Wellbeing Research Centre, “World Happiness Report 2025” [original data].
Source: Wellbeing Research Centre (2025) – with major processing by Our World In Data

### What you should know about this data
* The Cantril ladder asks respondents to think of a ladder, with the best possible life for them being a 10 and the worst possible life being a 0. They are then asked to rate their own current lives on that 0 to 10 scale.
* The rankings are three-year averages, calculated by the World Happiness report based on nationally representative samples collected by the Gallup World Poll. The data for the 2025 report draws from survey data from 2022-2024.
* We show the data for final year of the three-year survey period, i.e. we show the 2022-2024 survey data for the year 2024.
* The number of people and countries surveyed varies year to year, but typically more than 100,000 people in 130 countries participate in the Gallup World Poll each year.
* The rankings are based entirely on the survey scores, which are weighted by Gallup to make the estimates representative.

### Source

#### Wellbeing Research Centre – World Happiness Report
Retrieved on: 2025-03-28  
Retrieved from: https://worldhappiness.report/ed/2025/  

#### Notes on our processing step for this indicator
We calculated the average of regions by taking a population-weighted average over all countries within that region.


    