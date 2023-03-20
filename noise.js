const { createNoise2D } = require('simplex-noise');

function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

function vectorNoise(size, base) {
    let noise2d = createNoise2D();
    let output = [];
    for (let x = 0; x < size; x++) {
        output.push([]);
        for (let y = 0; y < size; y++) {
            output[x].push(noise2d(x / size, y / size));
        }
    }

    output.map((a, x) =>
        a.map((c, y) =>
            output[x][y] = Math.floor(sigmoid(c)* base)
        )
    )

    return output
}

module.exports.vectorNoise = vectorNoise;