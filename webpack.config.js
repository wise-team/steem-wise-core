'use strict';

const path = require('path');
const webpack = require('webpack');

const DEFAULTS = {
    isDevelopment: process.env.NODE_ENV !== 'production',
    baseDir: path.join(__dirname, '..'),
};

module.exports = {
    mode: (DEFAULTS.isDevelopment ? "development" : "production"),
    entry: "./dist/lib/steem-smartvotes",
    output: {
        path: path.resolve(__dirname, "dist/browser"),
        filename: "steem-smartvotes.min.js",
        library: "steemsmartvotes",
        libraryTarget: "umd"
    },
    devtool: (DEFAULTS.isDevelopment ? 'source-map' : 'cheap-eval-source-map'),
    target: "web",
    module: {
        rules: []
    },
    optimization: {
        minimize: (DEFAULTS.isDevelopment ? false : true)
    },
    resolve: {
        extensions: [".js", ".json"]
    },
    plugins: [
    ]
}
