import pandas as pd
import json
import os

output_data = {}

codes = {
  "Afghanistan": "AF",
  "Albania": "AL",
  "Algeria": "DZ",
  "Andorra": "AD",
  "Angola": "AO",
  "Antigua and Barbuda": "AG",
  "Argentina": "AR",
  "Armenia": "AM",
  "Australia": "AU",
  "Austria": "AT",
  "Azerbaijan": "AZ",
  "Bahamas": "BS",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Barbados": "BB",
  "Belarus": "BY",
  "Belgium": "BE",
  "Belize": "BZ",
  "Bhutan": "BT",
  "Bolivia": "BO",
  "Bosnia and Herzegovina": "BA",
  "Botswana": "BW",
  "Brazil": "BR",
  "Brunei": "BN",
  "Bulgaria": "BG",
  "Burundi": "BI",
  "Cambodia": "KH",
  "Cameroon": "CM",
  "Canada": "CA",
  "Cape Verde": "CV",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Costa Rica": "CR",
  "Croatia": "HR",
  "Cuba": "CU",
  "Cyprus": "CY",
  "Czechia": "CZ",
  "Denmark": "DK",
  "Dominica": "DM",
  "Dominican Republic": "DO",
  "East Timor": "TL",
  "Ecuador": "EC",
  "Egypt": "EG",
  "El Salvador": "SV",
  "Eritrea": "ER",
  "Estonia": "EE",
  "Eswatini": "SZ",
  "Ethiopia": "ET",
  "Fiji": "FJ",
  "Finland": "FI",
  "France": "FR",
  "French Guiana": "GF",
  "Georgia": "GE",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Greenland": "GL",
  "Grenada": "GD",
  "Guatemala": "GT",
  "Guinea-Bissau": "GW",
  "Guyana": "GY",
  "Haiti": "HT",
  "Honduras": "HN",
  "Hungary": "HU",
  "Iceland": "IS",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Israel": "IL",
  "Italy": "IT",
  "Jamaica": "JM",
  "Japan": "JP",
  "Jordan": "JO",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kiribati": "KI",
  "Kosovo": None,
  "Kuwait": "KW",
  "Latvia": "LV",
  "Lebanon": "LB",
  "Lesotho": "LS",
  "Liberia": "LR",
  "Liechtenstein": "LI",
  "Lithuania": "LT",
  "Luxembourg": "LU",
  "Malawi": "MW",
  "Malaysia": "MY",
  "Maldives": "MV",
  "Malta": "MT",
  "Marshall Islands": "MH",
  "Mauritania": "MR",
  "Mauritius": "MU",
  "Mexico": "MX",
  "Micronesia (country)": "FM",
  "Moldova": "MD",
  "Monaco": "MC",
  "Mongolia": "MN",
  "Montenegro": "ME",
  "Morocco": "MA",
  "Mozambique": "MZ",
  "Myanmar": "MM",
  "Namibia": "NA",
  "Nepal": "NP",
  "Netherlands": "NL",
  "New Caledonia": "NC",
  "New Zealand": "NZ",
  "Nicaragua": "NI",
  "Niger": "NE",
  "Nigeria": "NG",
  "North Macedonia": "MK",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Palau": "PW",
  "Palestine": "PS",
  "Panama": "PA",
  "Papua New Guinea": "PG",
  "Paraguay": "PY",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Puerto Rico": "PR",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  "Samoa": "WS",
  "San Marino": "SM",
  "Sao Tome and Principe": "ST",
  "Saudi Arabia": "SA",
  "Serbia": "RS",
  "Seychelles": "SC",
  "Sierra Leone": "SL",
  "Singapore": "SG",
  "Slovakia": "SK",
  "Slovenia": "SI",
  "Solomon Islands": "SB",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Suriname": "SR",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Tajikistan": "TJ",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Tonga": "TO",
  "Trinidad and Tobago": "TT",
  "Tunisia": "TN",
  "Turkey": "TR",
  "Turkmenistan": "TM",
  "Tuvalu": "TV",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  "Uruguay": "UY",
  "Uzbekistan": "UZ",
  "Vanuatu": "VU",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Yemen": "YE",
  "Zambia": "ZM",
  "Zimbabwe": "ZW",
  "Benin": "BJ",
  "Burkina Faso": "BF",
  "Central African Republic": "CF",
  "Chad": "TD",
  "Comoros": "KM",
  "Congo": "CG",
  "Cote d'Ivoire": "CI",
  "Democratic Republic of Congo": "CD",
  "Djibouti": "DJ",
  "Equatorial Guinea": "GQ",
  "Gabon": "GA",
  "Gambia": "GM",
  "Guinea": "GN",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Libya": "LY",
  "Madagascar": "MG",
  "Mali": "ML",
  "Nauru": "NR",
  "North Korea": "KP",
  "Senegal": "SN",
  "Somalia": "SO",
  "Sudan": "SD",
  "Togo": "TG",
  "Taiwan": "TW",
  "Western Sahara": "EH",
  "European Union (27)": None,
  "World": None
}


mapper = {
    "Land area (sq. km)": "Land area (sq. km)",
    "GDP per capita, PPP (constant 2021 international $)": "GDP per capita ($)",
    "Combined - average years of education for 15-64 years male and female youth and adults": "Average years of education",
    "Primary energy consumption per capita (kWh/person)": "Energy use per capita (KWh/person)",
    "Cantril ladder score": "Happiness (0-10)",
    "Mean (2021 prices)": "Daily mean income",
    "Homicide rate per 100,000 population - sex: Total - age: Total": "Homicide rate per 100,100",
    "Access to electricity (% of population)": "Electricity Access %"
}
for file in os.listdir("csvs"):
    print("------------- ",file)
    df = pd.read_csv("csvs/"+file)
    print(df.columns)
    for i, row in df.iterrows():
        if row["Entity"] not in output_data:
            output_data[row["Entity"]] = {}
        if not pd.isna(row[df.columns[3]]) and not pd.isnull(row[df.columns[3]]):
            out = {"value":row[df.columns[3]]}
            if "Year" in row and not pd.isna(row["Year"]):
                out["year"] = row["Year"]
            if "Code" in row and not pd.isna(row["Code"]):
                output_data[row["Entity"]]["code3"] = row["Code"]
            if row["Entity"] in codes:
                output_data[row["Entity"]]["code2"] = codes[row["Entity"]]

            if df.columns[3] in mapper:
                output_data[row["Entity"]][mapper[df.columns[3]]] = out
            else:
                output_data[row["Entity"]][df.columns[3]] = out

with open("population_pure.txt", "r") as f:
    lines = f.readlines()
    for line in lines:
        sp = line.replace("\t", " ").rsplit(None, 2)
        print(sp)
        population = int(sp[1].strip().replace(",",""))
        name = sp[0].strip()
        if name not in output_data:
            if name in mapper:
                output_data[name] = {"code2":mapper[name]}
            else:
                output_data[name] = {}
        output_data[name]["Population"] = {"value":population}


with open("compiled.json", "w") as f:
    json.dump(output_data, f, indent=2)