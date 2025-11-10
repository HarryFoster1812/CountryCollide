# Share of population living in extreme poverty - Data package

This data package contains the data that powers the chart ["Share of population living in extreme poverty"](https://ourworldindata.org/grapher/share-of-population-living-in-extreme-poverty-cost-of-basic-needs?overlay=download-data&v=1&csvType=filtered&useColumnShortNames=false) on the Our World in Data website.

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


## Cost of Basic Needs - Number in poverty
Number of people unable to meet basic needs (including minimal nutrition and adequately heated shelter) according to prices of locally-available goods and services at the time.
Last updated: October 9, 2023  
Next update: December 2025  
Date range: 1820–2018  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Michalis Moatsos (2021) – with major processing by Our World in Data

#### Full citation
Michalis Moatsos (2021) – with major processing by Our World in Data. “Cost of Basic Needs - Number in poverty” [dataset]. Michalis Moatsos, “Global extreme poverty - Present and past since 1820” [original data].
Source: Michalis Moatsos (2021) – with major processing by Our World In Data

### What you should know about this data
* The ‘cost of basic needs’ approach was recommended by the World Bank Commission on Global Poverty, headed by Tony Atkinson, as a complementary method in measuring poverty.
* Moatsos describes the methodology as follows: “In this approach, poverty lines are calculated for every year and country separately, rather than using a single global line. The second step is to gather the necessary data to operationalize this approach alongside imputation methods in cases where not all the necessary data are available. The third step is to devise a method for aggregating countries’ poverty estimates on a global scale to account for countries that lack some of the relevant data.”

### Source

#### Michalis Moatsos – Global extreme poverty - Present and past since 1820
Retrieved on: 2023-10-09  
Retrieved from: https://www.oecd-ilibrary.org/sites/e20f2f1a-en/index.html?itemId=/content/component/e20f2f1a-en  

#### Notes on our processing step for this indicator

        
From the share and number unable to meet basic needs available in the dataset, we can estimate the number below different "dollar a day" poverty lines. Additionally, we estimate the share and number above these poverty lines, as well between them. We also estimate the share and number of people able to meet basic needs.




## Number of people living in extreme poverty – Long-run estimates - Cost of basic needs
Number of people unable to meet basic needs (including minimal nutrition and adequately heated shelter) according to prices of locally-available goods and services at the time.
Last updated: October 9, 2023  
Next update: December 2025  
Date range: 1820–2018  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Michalis Moatsos (2021) – with major processing by Our World in Data

#### Full citation
Michalis Moatsos (2021) – with major processing by Our World in Data. “Number of people living in extreme poverty – Long-run estimates - Cost of basic needs” [dataset]. Michalis Moatsos, “Global extreme poverty - Present and past since 1820” [original data].
Source: Michalis Moatsos (2021) – with major processing by Our World In Data

### What you should know about this data
* The ‘cost of basic needs’ approach was recommended by the World Bank Commission on Global Poverty, headed by Tony Atkinson, as a complementary method in measuring poverty.
* Moatsos describes the methodology as follows: “In this approach, poverty lines are calculated for every year and country separately, rather than using a single global line. The second step is to gather the necessary data to operationalize this approach alongside imputation methods in cases where not all the necessary data are available. The third step is to devise a method for aggregating countries’ poverty estimates on a global scale to account for countries that lack some of the relevant data.”

### Source

#### Michalis Moatsos – Global extreme poverty - Present and past since 1820
Retrieved on: 2023-10-09  
Retrieved from: https://www.oecd-ilibrary.org/sites/e20f2f1a-en/index.html?itemId=/content/component/e20f2f1a-en  

#### Notes on our processing step for this indicator

        
From the share and number unable to meet basic needs available in the dataset, we can estimate the number below different "dollar a day" poverty lines. Additionally, we estimate the share and number above these poverty lines, as well between them. We also estimate the share and number of people able to meet basic needs.




    