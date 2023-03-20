const Jimp = require('jimp');

map_colors = [
    0x0061e6FF,
    0x0062e6FF,
    0x0063e6FF,
    0x0064e6FF,
    0x008000FF,
    0x007000FF,
    0x006000FF,
    0x005000FF,
    0x004000FF,
    0x003000FF,
    0x72ff1cFF,
    0x57e600FF
]

function makeImage(vector) {
    var imageName = "content/maps/" + Math.floor(Math.random() * 100000) + "map.jpg";
    var size = vector[0].length;

    let image = new Jimp(size, size, 'black', (err) => {
        if (err) throw err;
    });

    Jimp.read(image, (err, lenna) => {
        for (var y = 0; y < size; y++) {
            vector[y].map( (color, x) => {
                if (err) throw err;
                lenna.setPixelColor( map_colors[color], x, y);
            });
        }
        lenna.flip(false, true).write(imageName);
    });

    return imageName;
}

module.exports.makeImage = makeImage;