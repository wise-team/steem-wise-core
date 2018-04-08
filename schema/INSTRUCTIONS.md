# Steem smartvotes schema

This is the schema for all smartvotes custom_json operations on steem blockchain.

For better readability and easier maintenance schemas are written in Typescript. You can find typescript schema definitions in /schema/ts.

Besides of typescript definitions — JSON-schema definition is also required because it is more portable & easier to apply. Though it is needed to convert typescript into JSON-schema. In order to perform the conversion, please use the following script:

```bash
$ ./convert-schema-to-json.sh
```

Thank you. Converted "smartvotes.schema.json" should be included in commit.