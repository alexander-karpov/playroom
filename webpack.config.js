const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
            }),
        ],
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
        },
        devtool: 'source-map'
    };
};