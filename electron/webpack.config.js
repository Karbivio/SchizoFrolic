const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const ForkTsCheckerWebpackPlugin = require('@f-list/fork-ts-checker-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const vueTransformer = require('@f-list/vue-ts/transform').default;
const CopyPlugin = require('copy-webpack-plugin');

const mainConfig = {
    entry: [path.join(__dirname, 'main.ts'), path.join(__dirname, 'package.json')],
    output: {
        path: __dirname + '/app',
        filename: 'main.js'
    },
    context: __dirname,
    target: 'electron-main',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: __dirname + '/tsconfig-main.json',
                    transpileOnly: true
                }
            },
            {test: path.join(__dirname, 'package.json'), loader: 'file-loader', options: {name: 'package.json'}, type: 'javascript/auto'},
            {test: /\.html$/, loader: 'file-loader', options: {name: '[name].[ext]'}},
            {test: /\.raw\.js$/, loader: 'raw-loader'},
            {test: /(badge|ic_notification|icon|tray.*)\.(png|ico)$/, loader: 'file-loader', options: {name: '[name].[ext]'}},
            {test: /lotus\d+\.(png|ico)$/, loader: 'file-loader', options: {name: 'icons/[name].[ext]'}}
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            tslint: path.join(__dirname, '../tslint.json'),
            tsconfig: './tsconfig-main.json',
            ignoreLintWarnings: true,
        })
    ],
    resolve: {
        extensions: ['.ts', '.js']
    },
    optimization: {
        minimize: false,
        moduleIds: 'named',
        chunkIds: 'named',
    },
  }, rendererConfig = {
    entry: {
        chat: [path.join(__dirname, 'chat.ts'), path.join(__dirname, 'index.html')],
        window: [path.join(__dirname, 'window.ts'), path.join(__dirname, 'window.html'), path.join(__dirname, 'build', 'tray@2x.png')],
        browser_option: [path.join(__dirname, 'browser_option.ts'), path.join(__dirname, 'browser_option.html'), path.join(__dirname, 'build', 'tray@2x.png')]
    },
    output: {
        path: __dirname + '/app',
        publicPath: './',
        filename: '[name].js'
    },
    context: __dirname,
    target: 'electron-renderer',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    compilerOptions: {
                        preserveWhitespace: false
                    }
                }
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                    configFile: __dirname + '/tsconfig-renderer.json',
                    transpileOnly: true,
                    getCustomTransformers: () => ({before: [vueTransformer]})
                }
            },
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader'},
            {test: /\.(woff2?)$/, loader: 'file-loader'},
            {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader'},
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader'},
            {test: /\.mp3$/, loader: 'file-loader', options: {name: 'sounds/[name].[ext]'}},
            {test: /\.(png|ico|html)$/, loader: 'file-loader', options: {name: '[name].[ext]'}},
            {
                test: /\.vue\.scss/,
                // loader: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}},'sass-loader']
                use: [
                    'vue-style-loader',
                    {loader: 'css-loader', options: {esModule: false}},
                    {
                        loader: 'sass-loader',
                        options: {
                            warnRuleAsWarning: false,
                            sassOptions: {
                                quietDeps: true
                            }
                        }
                    }
                ]
            },
            {
                test: /\.vue\.css/,
                // loader: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}}]
                use: [
                    'vue-style-loader',
                    {loader: 'css-loader', options: {esModule: false}}
                ]
            },
            {test: /\.raw\.js$/, loader: 'raw-loader'}
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            tslint: path.join(__dirname, '../tslint.json'),
            tsconfig: './tsconfig-renderer.json',
            vue: true,
            ignoreLintWarnings: true,
        }),
        new VueLoaderPlugin(),
        new CopyPlugin(
            {
                patterns: [
                    {
                        from: path.resolve(__dirname, '..', 'chat', 'preview', 'assets', '**', '*').replace(/\\/g, '/'),
                        to: path.join('preview', 'assets'),
                        context: path.resolve(__dirname, '..', 'chat', 'preview', 'assets')
                    },
                    {
                        from: path.resolve(__dirname, '..', 'assets', '**', '*').replace(/\\/g, '/'),
                        to: path.join('assets'),
                        context: path.resolve(__dirname, '..', 'assets')
                    },
                    {
                        from: path.resolve(__dirname, 'build', 'icons', '*').replace(/\\/g, '/'),
                        to: path.join('icons'),
                        context: path.resolve(__dirname, 'build', 'icons')
                    }
                ]
            }
        )
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.css'],
        // alias: {qs: 'querystring'}
    },
    optimization: {
        splitChunks: {chunks: 'all', minChunks: 2, name: 'common'},
        minimize: false,
        moduleIds: 'named',
        chunkIds: 'named',
    }
};


const storeWorkerEndpointConfig = _.assign(
    _.cloneDeep(mainConfig),
    {
        entry: [path.join(__dirname, '..', 'learn', 'store', 'worker', 'store.worker.endpoint.ts')],
        output: {
            path: __dirname + '/app',
            filename: 'storeWorkerEndpoint.js',
            globalObject: 'this'
        },

        target: 'electron-renderer',

        node: {
            global: true,
        },

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: __dirname + '/tsconfig-renderer.json',
                        transpileOnly: true,
                        getCustomTransformers: () => ({before: [vueTransformer]})
                    }
                },
            ]
        },

        optimization: {
            minimize: false,
            moduleIds: 'named',
            chunkIds: 'named',
        },

        plugins: [
            new ForkTsCheckerWebpackPlugin({
                async: false,
                tslint: path.join(__dirname, '../tslint.json'),
                tsconfig: './tsconfig-renderer.json',
                vue: true,
                ignoreLintWarnings: true,
            })
        ]
    }
);


module.exports = function(mode) {
    const themesDir = path.join(__dirname, '../scss/themes/chat');
    const themes = fs.readdirSync(themesDir);
    for(const theme of themes) {
        if(!theme.endsWith('.scss')) continue;
        const absPath = path.join(themesDir, theme);
        rendererConfig.entry.chat.push(absPath);

        rendererConfig.module.rules.unshift(
            {
                test: absPath,
                use: [
                    {loader: 'file-loader', options: {name: 'themes/[name].css'}},
                    'extract-loader',
                    {loader: 'css-loader', options: {esModule: false}},
                    {
                        loader: 'sass-loader',
                        options: {
                            warnRuleAsWarning: false,
                            sassOptions: {
                                quietDeps: true
                            }
                        }
                    }
                ]
            }
        );
    }

    const faPath = path.join(themesDir, '../../fa.scss');
    rendererConfig.entry.chat.push(faPath);

    rendererConfig.module.rules.unshift(
        {
            test: faPath,
            use: [
                {loader: 'file-loader', options: {name: 'fa.css'}},
                'extract-loader',
                {loader: 'css-loader', options: {esModule: false}},
                {
                    loader: 'sass-loader',
                    options: {
                        warnRuleAsWarning: false,
                        sassOptions: {
                            quietDeps: true
                        }
                    }
                }
            ]
        }
    );

    if(mode === 'production') {
        process.env.NODE_ENV = 'production';

        mainConfig.devtool = false;
        rendererConfig.devtool = false;
        storeWorkerEndpointConfig.devtool = false;

        rendererConfig.plugins.push(new OptimizeCssAssetsPlugin());
    } else {
        mainConfig.devtool = 'source-map';
        rendererConfig.devtool = 'source-map';
        storeWorkerEndpointConfig.devtool = 'source-map';
    }

    return [storeWorkerEndpointConfig, mainConfig, rendererConfig];
};
