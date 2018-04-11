# Steem smartvotes schema

This is the schema for all smartvotes custom_json operations on steem blockchain. A blockchain operation is parsed as smartvotes operation,
when it has the following parameter set: `type: "smartvote";` Then it is validated using **smartvotes_operation** type. To sum up: every
smartvotes operation must implement **smartvotes_operation**, which can be found in *operation.schema.ts* file.

### Building

For better readability and easier maintenance schemas are written in Typescript. You can find typescript schema definitions in /schema/ts.

Besides of typescript definitions — JSON-schema definition is also required because it is more portable & easier to apply. Though it is needed to convert typescript into JSON-schema. In order to perform the conversion, please use the following script:

```bash
$ npm run build-schema
```

Schema conversion also occures when you run `npm build`.

Thank you. Converted "smartvotes.schema.json" should be included in commit.
