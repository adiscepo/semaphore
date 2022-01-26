const http = require('http');
const express = require("express");
const app = express();
const server = http.createServer(app);
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const port = 1337;
const io = require('socket.io')(server, { cors: { origin: '*' } });
var multer = require('multer'); // Pour l'upload d'image
const fs = require('fs'); // Suppression de fichier

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/background/')
    },
    filename: function (req, file, cb) {
        cb(null, req.cookies.id_user + '-' + generateSecretKey(6) + "." + file.mimetype.split('/')[1])
    }
  })

const upload = multer({ storage: storage }).single("background")

app.use(cors());
app.set('view-engine', 'ejs');
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
})

app.use(session({
    secret: generateSecretKey(),
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// app.io = io // Attache l'instance io à l'application

app.use(express.static(__dirname + '/public')); // Donne accès au contenu du dossier "public" à la vue (fichier .ejs) (en gros)
app.use(express.static(__dirname + '/utils'));
app.use('/static', express.static('node_modules'));

app.get("/", async (req, res, next) => {
    console.log("[GET] /")
    let response = await fetch("http://127.0.0.1:2021/api/user");
    if (response.ok){
        var datas = await response.json();
        var list_user = {};
        datas.forEach((data) => {
            list_user[data._id] = {name: data.name, passwd: data.passwd};
        });
        res.render("index.ejs", { 
            users: list_user, 
            userId: req.session.id_user,
            isLogged: req.session.logged_in 
        });
    }
});

app.get("/add_user", (req, res, next) => {
    console.log("[GET] /add_user");
    res.render("add_user.ejs")
});

app.post("/add_user", async (req, res, next) => {
    console.log("[POST] /add_user");
    var name    = req.body.name;
    var passwd  = req.body.passwd;
    var user = { name: name, passwd: passwd };
    let response = await fetch("http://127.0.0.1:2021/api/user", {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(user)
    })
    if (response.ok) { res.status(201).end(); return; }
    var data = await response.json();
    res.status(response.status).json(data);
});

app.get('/gate/:_id', async (req, res) => {
    var id = req.params._id;
    let response = await fetch("http://127.0.0.1:2021/api/user/" + id);
    if (response.ok) {
        var datas = await response.json();
        res.render("post.ejs", { datas: datas });
    }else if (response.status == 404) {
        res.redirect("/")
    }else{
        res.redirect("/")
    }
})

app.get('/view/:_id', async (req, res) => {
    var id = req.params._id;
    let response_post = await fetch("http://127.0.0.1:2021/api/current/post/" + id);
    let response_background = await fetch("http://127.0.0.1:2021/api/current/background/" + id);
    if (response_post.ok) {
        var background_info  = {}
        if (response_background.ok) background_info = await response_background.json()
        else                        background_info = "default"
        var datas = await response_post.json();
        res.render("view.ejs", { post: datas, background: background_info });
    }else if (response_post.status == 404) {
        console.log("Ce post n'existe pas")
        res.redirect("/")
    }else{
        res.redirect("/")
    }
})

app.get("/manage/", async (req, res) => {
    var id = await checkIfUserIsConnected(req)
    if (id) {
        let posts_info  = await fetch("http://127.0.0.1:2021/api/posts/" + id);
        let backgrounds_info  = await fetch("http://127.0.0.1:2021/api/backgrounds/" + id);
        let user_info = await fetch("http://127.0.0.1:2021/api/user/" + id);
        if (user_info.ok) {
            var posts = {}
            var backgrounds = {}
            if (posts_info.ok) posts = await posts_info.json();
            if (backgrounds_info.ok) backgrounds = await backgrounds_info.json();
            var data_user = await user_info.json();
            let current_post = await fetch("http://127.0.0.1:2021/api/current/post/" + id);
            let current_background = await fetch("http://127.0.0.1:2021/api/current/background/" + id);
            var id_current_post       = false 
            var id_current_background = false
            if (current_post.ok){
                let data_current = await current_post.json()
                id_current_post = data_current._id
            }
            if (current_background.ok){
                let data_current = await current_background.json()
                id_current_background = data_current._id
            }
            res.render("manage.ejs", { user: data_user, posts: posts, id_current_post: id_current_post, backgrounds: backgrounds, id_current_background: id_current_background });
        }else if (posts_info.status == 404) {
            res.redirect("/")
        }
    }else{
        res.redirect("/")
    }
})

app.put("/manage/post/change_current", (req, res) => {
    var id_user = req.body.id_user
    var id_post = req.body.id_post
    if (checkIfUserIsConnected(req)) {
        fetch("http://127.0.0.1:2021/api/current/post/", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({ id_author: id_user, id_post: id_post })
        }).then(async (response) => {
            if (response.status == 200 || response.status == 202) {
                let current_post = await fetch("http://127.0.0.1:2021/api/post/" + id_post)
                let current_post_datas = await current_post.json()
                io.emit("update_post", current_post_datas)
                res.status(200).end()
                return;
            }
            else res.status(400).json({error: "A error occured"}).end()
        })
    }else{
        res.status(401).json({error: "You're not authorized to do that"}).end()
        return;
    }
})

app.put("/manage/background/change_current", (req, res) => {
    var id_user = req.body.id_user
    var id_background = req.body.id_background
    if (checkIfUserIsConnected(req)) {
        fetch("http://127.0.0.1:2021/api/current/background/", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({ id_author: id_user, id_background: id_background })
        }).then(async (response) => {
            if (response.status == 200 || response.status == 202) {
                let current_background = await fetch("http://127.0.0.1:2021/api/background/" + id_background)
                let current_background_datas = await current_background.json()
                io.emit("update_background", current_background_datas)
                res.status(200).end()
                return;
            }
            else res.status(400).json({error: "A error occured"}).end()
        })
    }else{
        res.status(401).json({error: "You're not authorized to do that"}).end()
        return;
    }
})

app.delete("/manage/post/", (req, res) => {
    var id = checkIfUserIsConnected(req)
    if (id) {
        var id_post = req.body.id_post
        fetch("http://127.0.0.1:2021/api/post/" + id_post, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }).then((response) => {
            if (response.ok) {
                res.status(200).end()
                return;
            } else {
                res.status(400).json({error: "A error occured"})
                return;
            }
        })
    }else{
        res.status(401).json({error: "User is not connected"})
        return;
    }
})

app.delete("/manage/background", async (req, res) => {
    var id = await checkIfUserIsConnected(req)
    if (id) {
        var id_background = req.body.id_background
        var path_to_background = req.body.path
        fetch("http://127.0.0.1:2021/api/background", {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({ id_background: id_background })
        }).then(response => {
            if(response.ok) {
                fs.unlink("./public" + path_to_background, (err) => {
                    if (err) console.log(err)
                    else console.log(path_to_background + " supprimé")
                })
                res.status(200).end()
                return;
            }else{
                res.status(400).end()
                return;
            }
        })
    }else{
        res.status(401).end()
        return;
    }
})

app.get("/logout/", (req, res) => {
    var id = checkIfUserIsConnected(req)
    if (id) {
        req.session.destroy()
        if (req.cookies.secret_key){
            fetch("http://127.0.0.1:2021/api/session", {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({ secret: req.cookies.secret_key })
            })
        }
        res.clearCookie("id_user")
        res.clearCookie("secret_key")
    }
    res.redirect("/")
})

app.post("/add_post/:_id", async (req, res) => {
    var id = checkIfUserIsConnected(req)
    if (id) {
        var id = req.params._id;
        var post = {
            id_author: id,
            text: req.body.text,
            sub_text: req.body.sub_text,
            color: req.body.color,
        }

        let response = await fetch("http://127.0.0.1:2021/api/post", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(post)
        })

        var data = await response.json();
        if (response.ok) { res.redirect("/manage/"); return; } 
        res.redirect("/manage?err=" + data.error);
    }else{
        res.status(401).end()
    }
})

app.post("/register", async (req, res) => {
    var id = req.body.id
    var passwd = req.body.passwd
    var stayConnected = req.body.stayConnected
    var credentials = { id: id, passwd: passwd }
    let response = await fetch("http://127.0.0.1:2021/api/user/check", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(credentials)
    })
    if (response.status == 200) {
        req.session.id_user = id
        req.session.logged_in = true
        if (stayConnected){
            res.cookie("id_user", id, {
                expires: new Date((2**31-1) * 1000)
            })
            var secret = generateSecretKey()
            res.cookie("secret_key", secret, {
                expires: new Date((2**31-1) * 1000),
                httpOnly: true
            })
            fetch("http://127.0.0.1:2021/api/session", {
                method: "POST", 
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    id_user: id,
                    secret: secret
                })
            })
        }
        res.status(200).end();
    }else{
        res.status(401).end()
    }
})

app.post("/add_background/:_id", async (req, res) => {
    var id = await checkIfUserIsConnected(req)
    if (id) {
        upload(req, res, function (err) {
            if (err) {
                res.status(400).redirect("/manage?err=Error")
                return;
            }else{
                if (res.req.file != undefined){
                    // Ajoute le fichier en bdd
                    var path = res.req.file.filename
                    var background = JSON.stringify({ id_author: id, path: path })
                    fetch("http://127.0.0.1:2021/api/background/", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json;charset=utf-8'
                        },
                        body: background
                    }).then(async response => {
                        if (response.ok) {
                            let data_background = await response.json()
                            let current_background = await fetch("http://127.0.0.1:2021/api/background/" + data_background._id)
                            let current_background_datas = await current_background.json()
                            io.emit("update_background", current_background_datas)
                            res.status(200).redirect("/manage")
                        } else res.status(400).redirect("/manage")
                        return;
                    })
                }else{
                    res.status(400).redirect("/manage")
                }
            }
        })
    } else {
        res.status(401).redirect("/")
    }
})

// Socket.IO

io.on('connection', function (socket) {
    console.log("Connected succesfully to the socket ...");
    
    socket.on('update', (id) => {
        socket.broadcast.emit('update_post', id)
    });
});

// Check si l'user a une session active
// Return l'id si oui, false sinon
async function checkIfUserIsConnected(req) {
    if (req.session.id_user) return req.session.id_user; // L'user s'est connecté cette session
    if (req.cookies.secret_key && req.cookies.id_user) {
        let response = await fetch("http://127.0.0.1:2021/api/session/" + req.cookies.id_user)
        if (response.ok) {
            let data = await response.json()
            if (data.secret == req.cookies.secret_key && data.id_user == req.cookies.id_user) return req.cookies.id_user
            else return false
      }
    }
    return false
}

function generateSecretKey(length = 32) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@#!%';
    let res = '';
    for (let i = 0; i < length; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
}

server.listen(port)

module.exports = app;