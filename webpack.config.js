const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
    if (!env.game) {
        throw new Error('Нужно передать название папки с игрой в --env game=[folder]')
    }

    const mode = env.production ? 'production' : 'development';

    console.log('Mode:', mode);

    return {
        entry: `./src/games/${env.game}/index.ts`,
        mode,
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.(vert|frag)$/,
                    type: 'asset/source'
                }
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                '~': path.resolve(__dirname, 'src'),
            },
        },
        plugins: getPlugins(env),
        devServer: {
            static: [
                {
                    directory: path.join(__dirname, 'assets'),
                    publicPath: '/assets',
                },
                './dist',
            ],
        },
        optimization: {
            runtimeChunk: 'single',
            usedExports: true,
            sideEffects: true,
            providedExports: true,
        },
        // https://webpack.js.org/configuration/devtool/
        devtool: mode === 'development' ? 'source-map' : 'hidden-source-map'
    };
};

function getPlugins(env) {
    const plugins = [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        })
    ];

    if (env.analyze) {
        plugins.push(new BundleAnalyzerPlugin())
    }

    return plugins;
}
