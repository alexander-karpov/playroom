const path = require('path');

module.exports = {
    entry: './src/index.ts',
    mode: 'development', //production development
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
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
    },
};