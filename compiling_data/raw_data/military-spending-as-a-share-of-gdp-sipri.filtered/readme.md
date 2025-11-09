# Military spending as a share of GDP - Data package

This data package contains the data that powers the chart ["Military spending as a share of GDP"](https://ourworldindata.org/grapher/military-spending-as-a-share-of-gdp-sipri?overlay=download-data&v=1&csvType=filtered&useColumnShortNames=false) on the Our World in Data website.

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For normal countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The remaining columns are the data columns, each of which is a time series. If the CSV data is downloaded using the "full data" option, then each column corresponds to one time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data columns are transformed depending on the chart type and thus the association with the time series might not be as straightforward.

## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

### How we process data at Our World In Data
All data and visualizations on Our World in Data rely on data sourced from one or several original data providers. Preparing this original data involves several processing steps. Depending on the data, this can include standardizing country names and world region definitions, converting units, calculating derived indicators such as per capita measures, as well as adding or adapting metadata such as the name or the description given to an indicator.
[Read about our data pipeline](https://docs.owid.io/projects/etl/)

## Detailed information about each time series


## Military expenditure (% of GDP)
Total military expenditure divided by [gross domestic product](#dod:gdp), expressed as a percentage.
Last updated: April 28, 2025  
Next update: April 2026  
Date range: 1949–2024  
Unit: % of GDP  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Stockholm International Peace Research Institute (2025) – with minor processing by Our World in Data

#### Full citation
Stockholm International Peace Research Institute (2025) – with minor processing by Our World in Data. “Military expenditure (% of GDP)” [dataset]. Stockholm International Peace Research Institute, “SIPRI Military Expenditure Database” [original data].
Source: Stockholm International Peace Research Institute (2025) – with minor processing by Our World In Data

### What you should know about this data
* This data includes military and civil personnel, operation and maintenance, procurement, military research and development, infrastructure, and aid. Civil defense and current expenditures for previous military activities are excluded.

### How is this data described by its producer - Stockholm International Peace Research Institute (2025)?
Although the lack of sufficiently detailed data makes it difficult to apply a common definition of military expenditure on a worldwide basis, SIPRI has adopted a definition as a guideline. Where possible, SIPRI military expenditure data include all current and capital expenditure on:
(a) the armed forces, including peacekeeping forces;
(b) defence ministries and other government agencies engaged in defence projects;
(c) paramilitary forces, when judged to be trained and equipped for military operations; and
(d) military space activities.
This should include expenditure on:
i. personnel, including:
a. salaries of military and civil personnel;
b. retirement pensions of military personnel, and;
c. social services for personnel;
ii. operations and maintenance;
iii. procurement;
iv. military research and development;
v. military infrastructure spending, including military bases. and;
vi. military aid (in the military expenditure of the donor country).
SIPRI’s estimate of military aid includes financial contributions, training and operational costs, replacement costs of the military equipment stocks donated to recipients and payments to procure additional military equipment for the recipient. However, it does not include the estimated value of military equipment stocks donated.
Civil defence and current expenditures on previous military activities, such as veterans' benefits, demobilization, conversion and weapon destruction are excluded.
In practice it is not possible to apply this definition for all countries, and in many cases SIPRI is confined to using the national data provided. Priority is then given to the choice of a uniform definition over time for each country in order to achieve consistency over time, rather than to adjusting the figures for single years according to a common definition. In the light of these difficulties, military expenditure data is most appropriately used for comparisons over time, and may be less suitable for close comparison between individual countries. Reference should always be made, when comparing data for different countries, to the footnotes and special notes attached to the data for these countries, which indicate deviations from the SIPRI definition, where these are known.

### Source

#### Stockholm International Peace Research Institute – SIPRI Military Expenditure Database
Retrieved on: 2025-04-30  
Retrieved from: https://www.sipri.org/databases/milex  


## World regions according to OWID
Regions defined by Our World in Data, which are used in OWID charts and maps.
Last updated: January 1, 2023  
Date range: 2023–2023  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Our World in Data – processed by Our World in Data

#### Full citation
Our World in Data – processed by Our World in Data. “World regions according to OWID” [dataset]. Our World in Data, “Regions” [original data].
Source: Our World in Data

### Source

#### Our World in Data – Regions


    