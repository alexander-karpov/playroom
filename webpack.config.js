const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
    const mode = env.production ? 'production' : 'development';

    console.log('Mode:', mode);

    return {
        entry: './src/games/music/index.ts',
        mode,
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
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
            extensions: ['.ts', '.js'],
            alias: {
                '@ecs': path.resolve(__dirname, 'src/ecs'),
                '@systems': path.resolve(__dirname, 'src/systems'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@utils': path.resolve(__dirname, 'src/utils'),
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Game',
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