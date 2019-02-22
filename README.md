# Air Supply

_You need data; Air Supply will get it to you._

Air Supply is a versatile library to handle getting data from multiple sources in a sane way to use in your application build, data analysis, or whatever else requires fetching some data.

[![npm version](https://img.shields.io/npm/v/air-supply.svg?style=flat-square)](https://www.npmjs.com/package/air-supply)
[![github](https://img.shields.io/github/stars/zzolo/air-supply.svg?style=social)](https://github.com/zzolo-air-supply)

## Why

Air Supply aims to address the need of having to bring in various data sources when making small or mid-size, self-contained projects. Air Supply was originally conceived while working at the Star Tribune where we often create small projects and different, non-dynamic data sources are needed for most of them. Air Supply is essentailly putting together and making a consistent interface for lots of one-off code around getting and parsing data that was written and used for many years.

### Pros

- Can handle many sources of data, such as local files and directories, HTTP(S) sources, Google Docs and Sheets, many SQL sources, AirTable, and more. See [Packages](#packages).
- Can easily parse and transform data such as CSV-ish, MS Excel, YAML, Shapefiles, ArchieML, zip files, and more. See [parsers](#parsers)
- Caches by default.
- Aimed at simple uses by just writing a JSON config, as well as more advanced transformations.
- Loads dependency modules as needed and allows for overriding.

### Cons

- Not focused on performance (yet). The caching mitigates a lot of issues here, but the goal would be to use streams for everything where possible.
- Not meant for very complex data pipelines. For instance, if you have to scrape a thousand pages, Air Supply doesn't currently fit well, but could still be used to pull the processed data into your application.

### Similar projects

These projects do roughly similar things, but not to the same degree:

- [quaff](https://www.npmjs.com/package/quaff)
- [indian-ocean](https://mhkeller.github.io/indian-ocean/)

## Installation

```sh
npm install air-supply --save
```

By default Air Supply only installs the most common dependencies for its [packages](#packages) and [parsers](#parsers). This means, if you need specific more parsers and packages, you will need to install them as well. For instance:

```sh
npm install googleapis archieml
```

### Command line use (global)

If you just want to use the command-line tool, install globally like:

```sh
npm install -g air-supply
```

If you plan to use a number of the packages and parsers, it could be easier (though uses more disk-space), to install all the "dev dependencies" which includes all the packages and parser dependences:

```sh
NODE_ENV=dev npm install -g air-supply
```

## Usage

Air Supply can be used as a regular Node library, or it can utilize config files that can be run via a command-line tool or as well as through Node.

### Basics

Basic usage in Node by defining the Packages when using Air Supply.

```js
const { AirSupply } = require('air-supply');

// Create new AirSupply object and tell it about
// the packages it needs
let air = new AirSupply({
  packages: {
    remoteJSONData: 'http://example.com/data.json',
    // To use Google Sheet package, make sure to install
    // the googleapis module:
    // npm install googleapis
    googleSheetData: {
      source: 'XXXXXXX',
      type: 'google-sheet'
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

The command line tool will look for configuration in multiple places. See [Configuration files](#configuration-files) below. You can simply call it with:

```sh
air-supply
```

A configuration file, such as a `.air-supply.json`, will be loaded and run through Air Supply, outputting the fetched and transformed data to the command line (stdout).:

```json
{
  "packages": {
    "cliData": "some-file.yml"
  }
}
```

You can also point the comand-line tool to a specific file if you want:

```sh
air-supply -c air-supply.rc > data.json
```

## Examples

Any AirSupply options are passed down to each Package, so we can define a custom `ttl` (cache time) to AirSupply and then override for each package.

```js
const { AirSupply } = require("air-supply");
// Since we are using the YAML parser, make sure module is installed
// npm install js-yaml

let air = new AirSupply({
  ttl: 1000 * 60 * 60,
  packages: {
    // This data will probably not change during our project
    unchanging: {
      ttl: 1000 * 60 * 60 * 24 * 30,
      source: "http://example.com/data.json"
    },
    defaultChanging: "https://example/data.yml"
  }
});
await air.supply();
```

Each Package can be given a transform function to transform data. We can also alter when the caching happens. this can be helpful in this instance so that we don't do an expensive task like parsing HTML.

```js
// Cheerio: https://cheerio.js.org/
const cheerio = require("cheerio");
const { AirSupply } = require("air-supply");

let air = new AirSupply({
  packages: {
    htmlData: {
      // Turn off any parsing, since we will be using cheerio
      parser: false,
      source: "http://example.com/html-table.html",
      // Transform function
      transform(htmlData) {
        $ = cheerio.load(htmlData);
        let data = [];
        $("table.example tbody tr").each(function(i, $tr) {
          data.push({
            column1: $tr.find("td.col1").text(),
            columnNumber: parseInteger($tr.find("td.col2").text(), 10)
          });
        });

        return data;
      },
      // Alter the cachePoint so that AirSupply will cache this
      // after the transform
      cachePoint: "transform"
    }
  }
});
await air.supply();
```

You can easily read a directory of files. If you just give it a path to a directory, it will assume you mean a [glob](https://github.com/isaacs/node-glob) of `**/*` in that directory.

```js
const { AirSupply } = require("air-supply");

let air = new AirSupply({
  packages: {
    directoryData: "path/to/directory/"
  }
});
await air.supply();
```

This might cause problems or otherwise be an issue as it will read every file recursively in that directory. So, it may be helpful to be more specific and define a glob to use. This requires being explicit about the type of Package. We can also use specific `parserOptions` to define how to parse files.

```js
// In this example we are using the csv and yaml parsers, so make sure to:
// npm install js-yaml csv-parse
const { AirSupply } = require("air-supply");

let air = new AirSupply({
  packages: {
    directoryData: {
      source: "path/to/directory/**/*.{json|yml|csv|custom-ext}",
      type: "directory"
      // The Directory Package type will define the `parser` option as
      // { multiSource: true } which will tell the parser to treat it
      // as an object where each key is a source.  This means, we can
      // define specific options for specific files.
      parserOptions: {
        "file.custom-ext": {
          parser: "yaml"
        }
      }
    }
  }
});
await air.supply();
```

You can also achieve something similar by just overriding the parser configuration to handle other extensions. Here we will update the YAML matching for another extension.

```js
// In this example we are using the csv and yaml parsers, so make sure to:
// npm install js-yaml csv-parse
const { AirSupply } = require("air-supply");

let air = new AirSupply({
  parserMethods: {
    yaml: {
      match: /(yaml|yml|custom-ext)$/i
    }
  },
  packages: {
    directoryData: {
      source: "path/to/directory/**/*.{json|yml|csv|custom-ext}",
      type: "directory"
    }
  }
});
await air.supply();
```

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

Note that many packages require specific modules to be installed separately.

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
      cachePoint: "transform",
      // Use the output option to save the fully loaded data
      // to the filesystem.  This is useful if you need to save files
      // that will get loaded into the client (asynchronously).
      output: "things.json"
    }
  }
});
```

| Package     | Description                                                                                                                                                                                                          | Docs                                            | Dependencies             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------ |
| AirTable    | Get data from an [AirTable](https://airtable.com/) table.                                                                                                                                                            | [API](https://zzolo.org/air-supply#airtable)    | `npm install airtable`   |
| Data        | Just pass JS data through.                                                                                                                                                                                           | [API](https://zzolo.org/air-supply#data)        |
| Directory   | Read files from a directory and parse each one if can.                                                                                                                                                               | [API](https://zzolo.org/air-supply#directory)   |
| File        | Read a file from the filesystem.                                                                                                                                                                                     | [API](https://zzolo.org/air-supply#file)        |
| Ftp         | Get a file from an FTP source.                                                                                                                                                                                       | [API](https://zzolo.org/air-supply#ftp)         | `npm install ftp`        |
| GoogleDoc   | Get plain text version of a Google Doc and by default parse with ArchieML. Can be a "Published to the web" URL, or if given an ID will use Google's authentication.                                                  | [API](https://zzolo.org/air-supply#googledoc)   | `npm install googleapis` |
| GoogleSheet | Get tabular data from a Google Sheet and assumes first row is headers by default. Uses Google's authentication; if you want to use a public "Published to the web" CSV, just use the Http package with a CSV parser. | [API](https://zzolo.org/air-supply#googlesheet) | `npm install googleapis` |
| Http        | Get data from an HTTP source.                                                                                                                                                                                        | [API](https://zzolo.org/air-supply#http)        |
| Sql         | Get data from SQL sources as that are supported by [sequelize](https://www.npmjs.com/package/sequelize).                                                                                                             | [API](https://zzolo.org/air-supply#sql)         | `npm install sequelize`  |

## Parsers

Parsers are simple functions to transform common data; mostly these are used to transform the raw data to more meaningful JSON data.

Note that most parsers require specific modules to be installed separately.

The `parsers` options can be defined a few different ways:

- If it is `undefined`, the package will try to determine which parser to use by looking at the `source`.
- If it is `false`, then no parsing will happen.
- If it is a string, such as `'csv'`, then it will use that parser with any default options.
- If it is a function, then it will simply run the data through that function.
- If it is an object, it should have a `parser` key which is the is one of the above options, and optionally a `parserOptions` that will get passed the parser function. Or it can just be `{ multiSource: true }` which will assume the data coming in is an object where each key is a source.
- If it is an array, it is assume to be multiple parsers with the above options.

The following parsers are available by default.

| Parser    | Description                                                                                             | Source match             | Docs                                          | Dependencies                    |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------- | ------------------------------- |
| archieml  | Uses [archieml](http://archieml.org/).                                                                  | `/aml$/i`                | [API](https://zzolo.org/air-supply#archieml)  | `npm install archieml`          |
| csv       | Uses [csv-parse](https://csv.js.org/parse/api/). Can be used for any delimited data.                    | `/csv$/i`                | [API](https://zzolo.org/air-supply#csv)       | `npm install csv-parse`         |
| gpx       | Uses [togeojson](https://github.com/mapbox/togeojson).                                                  | `/gpx$/i`                | [API](https://zzolo.org/air-supply#gpx)       | `npm install @mapbox/togeojson` |
| json      | Uses [json5](https://www.npmjs.com/package/json5).                                                      | `/json5?$/i`             | [API](https://zzolo.org/air-supply#json)      |
| kml       | Uses [togeojson](https://github.com/mapbox/togeojson).                                                  | `/kml$/i`                | [API](https://zzolo.org/air-supply#kml)       | `npm install @mapbox/togeojson` |
| reproject | Reprojects GeoJSON using [reproject](https://www.npmjs.com/package/reproject).                          | NA                       | [API](https://zzolo.org/air-supply#reproject) | `npm install reproject epsg`    |
| shapefile | Parsers a Shapefile (as a .zip or .shp file) using [shpjs](https://www.npmjs.com/package/shpjs).        | `/(shp.*zip|shp)$/i`     | [API](https://zzolo.org/air-supply#shapefile) | `npm install shpjs`             |
| topojson  | Transforms GeoJSON to TopoJSON using [topojson](https://www.npmjs.com/package/topojson).                | `/geo.?json$/i`          | [API](https://zzolo.org/air-supply#topojson)  | `npm install topojson`          |
| xlsx      | Parsers MS Excel and others (.xlsx, .xls, .dbf, .ods) using [xlsx](https://github.com/sheetjs/js-xlsx). | `/(xlsx|xls|dbf|ods)$/i` | [API](https://zzolo.org/air-supply#xlsx)      | `npm install xlsx`              |
| yaml      | Uses [js-yaml](https://www.npmjs.com/package/js-yaml).                                                  | `/(yml|yaml)$/i`         | [API](https://zzolo.org/air-supply#yaml)      | `npm install js-yaml`           |
| zip       | Uses [adm-zip](https://www.npmjs.com/package/adm-zip).                                                  | `/zip$/i`                | [API](https://zzolo.org/air-supply#zip)       | `npm install adm-zip`           |

## API

Full API documentation can be found at [zzolo.org/air-supply](https://zzolo.org/air-supply).

## Develop

### Documentation

Use `npm run docs:preview` and open [localhost:4001](http://localhost:4001) in a browser.

### Test

Run tests with: `npm run test`

## Publish

### NPM

1. Bump version in `package.json` and run `npm install`.
1. Commit.
1. Tag: `git tag X.X.X`
1. Push up: `git push origin master --tags`
1. Run `npm publish`

### Docs

Build and publish to Github Pages (after NPM publish): `npm run docs:publish`
