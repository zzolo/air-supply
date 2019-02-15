# Air Supply

_You need data; Air Supply will get it to you._

Air Supply is a versatile library to handle getting data from multiple sources in a sane way to use in your application build, data analysis, or whatever else requires fetching some data.

[![npm version](https://img.shields.io/npm/v/air-supply.svg?style=flat-square)](https://www.npmjs.com/package/air-supply)
[![npm](https://img.shields.io/npm/dm/air-supply.svg?style=flat-square)](https://www.npmjs.com/package/air-supply)

## Why

The main reason Air Supply was made to fill the need of having to bring in various data sources when making small, self-contained projects (in journalism). Air Supply is simply a way to bring together and make a consistent interface for lots of one-off code.

### Pros

- Can handle many sources of data, such as local files and directories, HTTP(S) sources, Google Docs and Sheets, many SQL sources, AirTable, and more.
- Can easily parse and transform data such as CSV-ish, MS Excel, YAML, Shapefiles, ArchieML, zip files, and more.
- Caches by default.
- Aimed at simple uses by just writing a JSON config, as well as more advanced transformations.

### Cons

- Not focused on performance (yet). The caching mitigates a lot of issues here, but the goal would be to use streams for everything where possible.
- The kitchen sink. Currently does not utilize peer dependencies, so an install of Air Supply brings a lot of things you might not use in your project.

### Similar projects

These projects do roughly similar things, but not to the same degree:

- [quaff](https://www.npmjs.com/package/quaff)
- [indian-ocean](https://mhkeller.github.io/indian-ocean/)

## Installation

```sh
npm install air-supply --save
```

If you just want to use the command-line tool, install globally like: `npm install -g air-supply`

## Usage

### Basics

Basic usage in Node by defining the packages when using Air Supply.

```js
const { AirSupply } = require("air-supply");

// Create new AirSupply object and tell it about
// the packages it needs
let air = new AirSupply({
  packages: {
    remoteJSONData: "http://example.com/data.json",
    googleSheetData: {
      source: "XXXXXXX",
      type: "google-sheet"
    }
  }
});

// Get the data, caching will happen by default
let data = await air.supply();

// Data will look something like this
{
  remoteJSONData: { ... },
  googleSheetData: [
    { column1: 'abc', column2: 234 },
    ...
  ]
}
```

### Command line

Command line usage with a `air-supply.rc` file:

```json
{
  "packages": {
    "cliData": "some-file.yml"
  }
}
```

Then point the CLI tool to the config.

```bash
air-supply -c air-supply.rc > data.json
```

## Examples

_TODO_

## Configuration files

Air Supply will look for a config files based on [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) rules with a little customization. So, it will read the first of any of these files as it goes up the directory tree:

```sh
package.json # An 'air-supply' property
.air-supply
.air-supply.json
.air-supply.json5
.air-supply.yaml
.air-supply.yml
.air-supply.js
air-supply.config.js
```

Note that any JSON will be read by the [json5](https://www.npmjs.com/package/json5) module.

## Packages

Packages are the methods that define how to get raw data from sources. The following are the available packages; see the full API documentation for all the specific options available.

Packages will get passed any options from the AirSupply object that is using it, as well has some common options and usage.

```js
AirSupply({
  ttl: 1000 * 60 * 10,
  packages: {
    things: {
      // Type is the kebab case of the package class name, i.e.
      // the package class name here would be PackageName.
      //
      // AirSupply will try to guess this given a source
      type: "package-name",
      // Almost all pcakages use the source option as it's
      // main option to get data
      source: "the main source option for this package",
      // Depending on the package, any options for the
      // fetching of data is ususally managed in fetchOptions
      fetchOptions: {
        fetchEverything: true
      },
      // Can override any defaults from the AirSupply object
      ttl: 1000 * 60 * 60,
      // Parsers are simple functions to transform the raw data.
      // This can be a string definign which parser to use,
      // an object of configuration, or an array of either if
      // you want to do multiple parsers.  The package
      // will guess what kind of parser is needed based on the source.
      parsers: ["zip", { multiSource: true }],
      // Custom transform function that will happen after parsing.
      transform(data) {
        return expensiveAlterFunction(data);
      },
      // Custom transform function that will happen after getting
      // all packages.
      bundle(allPackages) {
        return alterPackages(data);
      },
      // By default, caching will happen after fetching the raw data and
      // any of the built-in parsing.  But, you can cache after the 'transform'
      // or after the 'bundle'.
      //
      // Overall, this is only needed if you have expensive transformations
      cachePoint: "transform"
    }
  }
});
```

| Package     | Description                                                                                                                                                                                        | Docs                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| AirTable    | Get data from an [AirTable](https://airtable.com/) table.                                                                                                                                          | [API](https://zzolo.org/air-supply#airtable)    |
| Data        | Just pass JS data through.                                                                                                                                                                         | [API](https://zzolo.org/air-supply#data)        |
| Directory   | Read files from a directory and parse each one if can.                                                                                                                                             | [API](https://zzolo.org/air-supply#directory)   |
| File        | Read oen file from the filesystem.                                                                                                                                                                 | [API](https://zzolo.org/air-supply#file)        |
| Ftp         | Get a file from an FTP source.                                                                                                                                                                     | [API](https://zzolo.org/air-supply#ftp)         |
| GoogleDoc   | Get plain text version of a Google Doc and by default parse with ArchieML. Can be a publich "Published to the web" URL, or if given an ID will use Google's authentication.                        | [API](https://zzolo.org/air-supply#googledoc)   |
| GoogleSheet | Get tabular data from a Google Sheet and assumes first row is headers by default. Uses Google's authentication; if you want to use a public "Published to the web" CSV, just use the Http package. | [API](https://zzolo.org/air-supply#googlesheet) |
| Http        | Get data from an HTTP source.                                                                                                                                                                      | [API](https://zzolo.org/air-supply#http)        |
| Sql         | Get data from SQL sources as that are supported by [sequelize](https://www.npmjs.com/package/sequelize).                                                                                           | [API](https://zzolo.org/air-supply#sql)         |

## Parsers

Parsers are simple functions to transform common data; mostly these are used to transform the raw data to more meaningful JSON data.

The `parsers` options can be defined a few different ways:

- If it is `undefined`, the package will try to determine which parser to use by looking at the `source`.
- If it is `false`, then no parsing will happen.
- If it is a string, such as `'csv'`, then it will use that parser with any default options.
- If it is a function, then it will simply run the data through that function.
- If it is an object, it should have a `parser` key which is the is one of the above options, and optionally a `parserOptions` that will get passed the parser function. Or it can just be `{ multiSource: true }` which will assume the data coming in is an object where each key is a source.
- If it is an array, it is assume to be multiple parsers with the above options.

The following parsers are available by default.

| Parser    | Description                                                                                             | Source match             | Docs                                          |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------- |
| archieml  | Uses [archieml](http://archieml.org/).                                                                  | `/aml$/i`                | [API](https://zzolo.org/air-supply#archieml)  |
| csv       | Uses [csv-parse](https://csv.js.org/parse/api/). Can be used for any delimited data.                    | `/csv$/i`                | [API](https://zzolo.org/air-supply#csv)       |
| gpx       | Uses [togeojson](https://github.com/mapbox/togeojson).                                                  | `/gpx$/i`                | [API](https://zzolo.org/air-supply#gpx)       |
| json      | Uses [json5](https://www.npmjs.com/package/json5).                                                      | `/json5?$/i`             | [API](https://zzolo.org/air-supply#json)      |
| kml       | Uses [togeojson](https://github.com/mapbox/togeojson).                                                  | `/kml$/i`                | [API](https://zzolo.org/air-supply#kml)       |
| reproject | Reprojects GeoJSON using [reproject](https://www.npmjs.com/package/reproject).                          | NA                       | [API](https://zzolo.org/air-supply#reproject) |
| shapefile | Parsers a Shapefile (as a .zip or .shp file) using [shpjs](https://www.npmjs.com/package/shpjs).        | `/(shp.*zip|shp)$/i`     | [API](https://zzolo.org/air-supply#shapefile) |
| topojson  | Transforms GeoJSON to TopoJSON using [topojson](https://www.npmjs.com/package/topojson).                | `/geo.?json$/i`          | [API](https://zzolo.org/air-supply#topojson)  |
| xlsx      | Parsers MS Excel and others (.xlsx, .xls, .dbf, .ods) using [xlsx](https://github.com/sheetjs/js-xlsx). | `/(xlsx|xls|dbf|ods)$/i` | [API](https://zzolo.org/air-supply#xlsx)      |
| yaml      | Uses [js-yaml](https://www.npmjs.com/package/js-yaml).                                                  | `/(yml|yaml)$/i`         | [API](https://zzolo.org/air-supply#yaml)      |
| zip       | Uses [adm-zip](https://www.npmjs.com/package/adm-zip).                                                  | `/zip$/i`                | [API](https://zzolo.org/air-supply#zip)       |

## API

Full API documentation can be found at [zzolo.org/air-supply](https://zzolo.org/air-supply).

## Contribute

### Test

Run tests with: `npm run test`

```

```
