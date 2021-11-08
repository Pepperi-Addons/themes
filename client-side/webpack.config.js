const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
const webpack = require('webpack');
const { merge } = require('webpack-merge');
// const deps = require('./package.json').dependencies;

module.exports = (config, options, env) => {
    const mfConfig = {
        output: {
            uniqueName: "addon",
            publicPath: "http://localhost:4400/"
        },
        optimization: {
            // Only needed to bypass a temporary bug
            runtimeChunk: false
        },
        plugins: [
            new ModuleFederationPlugin({
                // remotes: {},
                name: "addon",
                filename: "addon.js",
                exposes: {
                    './AppModule': './src/app/app.module.ts'
                },
                shared: {
                    // ...deps,
                    "@angular/core": { eager: true, singleton: true, strictVersion: false },
                    "@angular/common": { eager: true, singleton: true, strictVersion: false },
                    "@angular/common/http": { eager: true, singleton: true, strictVersion: false },
                    "rxjs": { eager: true, singleton: true, strictVersion: false },
                    "@ngx-translate/core": { eager: true, singleton: true, strictVersion: false },
                    "@angular/router": { eager: true, singleton: true,  strictVersion: false }
                }
            })
        ],
    };

    const merged = merge(config, mfConfig);
    const singleSpaWebpackConfig = singleSpaAngularWebpack(merged, options);
    return singleSpaWebpackConfig;
    // Feel free to modify this webpack config however you'd like to
};
