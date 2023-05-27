const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fileSystem = require('fs');
const tips = require('./tips.json')
const order = require('./order.json')

const noise = require("./noise");
const image = require("./image");

var listUsers = [];
var list_desarmers = [];
var list_image = [];
var steps_count = 0;
var timer;

const os = require('os');
const { count } = require('console');
const networkInfo = os.networkInterfaces();

function get_path_files(diretorio) {
    var pathFilesList = fileSystem.readdirSync(diretorio);
    return pathFilesList;
}
function dinamic_routes(dir) {
    app.get("/" + dir, (req, res) => res.sendFile(__dirname + "/" + dir));
}

//Telas 
get_path_files("pages").map((page => {
    app.get("/" + page.split(".")[0], (req, res) => {
        res.sendFile(__dirname + '/pages/' + page);
    });
}))

//Dependencias
get_path_files("content/scripts").map((page => {
    app.get("/" + page, (req, res) => {
        res.sendFile(__dirname + '/content/scripts/' + page);
    });
}))

//Animations
get_path_files("content/animations").map((page => {
    app.get("/" + page, (req, res) => {
        res.sendFile(__dirname + '/content/animations/' + page);
    });
}))

//Animations
get_path_files("content/audio").map((page => {
    app.get("/" + page, (req, res) => {
        res.sendFile(__dirname + '/content/audio/' + page);
    });
}))

//Imagens
get_path_files("content/images").map((page => {
    list_image.push('/' + page);
    app.get("/" + page, (req, res) => {
        res.sendFile(__dirname + '/content/images/' + page);
    });
}))
app.get("/images/files", (req, res) => {
    res.json(list_image);
});

//Mapas
get_path_files("content/maps").map((page => {
    app.get("/" + page, (req, res) => {
        res.sendFile(__dirname + "/content/maps/" + page);
    });
}))

//Serviços
app.get("/noise", (req, res) => {
    var size = req.query.size;
    var base = req.query.base;
    res.status(200).send(noise.vectorNoise(size, base));
});
app.get("/makeImage", (req, res) => {
    var map = req.query.matriz;
    var response = image.makeImage(map);
    setTimeout(() => {
        dinamic_routes(response);
        res.status(200).send(response);
    }, 500)
});

app.get('/pages', (req, res) => {
    res.json({ pages: get_path_files("pages").map(a => a.split(".")[0]) })
});

app.get('/ip', (req, res) => {
    console.log(networkInfo) // ip
    res.sendStatus(200);
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/calculator', (req, res) => {
    res.sendFile(__dirname + '/content/fonts/Calculator.ttf');
});

app.get('/scripts/p5.min.js', (req, res) => {
    res.sendFile(__dirname + '/content/scripts/p5.min.js');
});
app.get('/scripts/sound.min.js', (req, res) => {
    res.sendFile(__dirname + '/content/scripts/sound.min.js');
});

app.get('/users', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

var screen_state;
var image_state;
var code_state;

app.get('/getstate/screen', (req, res) => {
    res.json(screen_state);
})

app.get('/getstate/image', (req, res) => {
    res.json(image_state);
})

app.get('/getstate/code', (req, res) => {
    res.json(code_state);
})

//Socket
io.on('connection', (socket) => {
    emit_list_of_users()
    socket.on('action', (params) => {
        clearInterval(timer);
        if(params.action == "changescreen")
            screen_state = params;
        io.of("/users").emit('receiveaction', params);
    })
    socket.on('qrcode', (params) => {
        io.emit('receiveqrcode', params);
    })
    socket.on('image', (params) => {
        image_state = params;
        io.emit('loadImage', params);
    })
    socket.on('code', (params) => {
        code_state = params;
        io.emit('loadCode', params);
    })
    socket.on('distribute_functions', () => {
        clearInterval(timer);
        explod = false;
        steps_count = 0;
        let bomber_id = list_desarmers[Math.floor(Math.random() * list_desarmers.length)];
        tips.map( a => {
            (function randomize_tips() {
                if(list_desarmers >= 2){
                do {
                    rand_id = list_desarmers[Math.floor(Math.random() * list_desarmers.length)]
                } while (bomber_id === rand_id);

                io.of("/bomb").to(rand_id).emit("tip", a)
            }
            })()
        })
        io.of("/bomb").to(bomber_id).emit("bomber");
    })
    let count = 20;
    socket.on('start_stopwatch', () => {
        clearInterval(timer);
        count = 300;
        timer = setInterval(() => {
            if(count >= 0){
                io.of("/bomb").emit("bip");
                io.of("/bomb").emit("stopwatch", count--);
            }else{
                io.of("/bomb").emit("explosion");
                clearInterval(timer);
            }
        }, 1000);
    })

});

io.of("/users").on('connection', (socket) => {
    listUsers.push(socket.id);
    emit_list_of_users();
    socket.on('disconnect', (sk) => {
        listUsers.splice(listUsers.indexOf(sk.id));
        emit_list_of_users();
    });
})

io.of("/bomb").on('connection', (socket) => {
    list_desarmers.push(socket.id);
    emit_list_of_desarmers();
    socket.on('disconnect', (sk) => {
        list_desarmers.splice(list_desarmers.indexOf(sk.id));
        emit_list_of_desarmers();
    });
    var explod = false;
    socket.on('bomb_action', (params) => {
        if(!explod){
            if(order[steps_count] == params)
                console.log(true);
            else{
                explod = true;
                io.of("/bomb").emit('explosion');
            }
    
            if(steps_count == 7){
                io.of("/bomb").emit('disarm');
            }
            steps_count++
        }
    })
})

function emit_list_of_users() {
    io.emit("listusers", listUsers);
}
function emit_list_of_desarmers() {
    io.emit("listdesarmers", list_desarmers);
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});