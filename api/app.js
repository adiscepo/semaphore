const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const user = require('./models/user');
const post = require('./models/post');
const current_post = require('./models/current_post');
const session = require('./models/session');
const background = require('./models/background');
const current_background = require('./models/current_background');
const cors = require("cors")
const hash = require('./utils/hash')
const VERBOSE = process.argv.includes("-v")
const port = 2021

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
})

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connexion à la base de données
var mongoDB = "mongodb://127.0.0.1:27017/semaphore";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', (err) => {
   log("Erreur lors de la connexion à la base de données");
});

function log(string) { if (VERBOSE) console.log(string); }

// USER

app.post("/api/user", (req, res, next) => {
    log("[POST] /api/user")
    var name    = req.body.name;
    var passwd  = req.body.passwd;
    if (name != undefined && passwd != undefined){
        if (name.length >= 3){
            if (passwd.length >= 8){
                user.findOne({ "name": name }, (err, data) => { 
                    if (data == null) {
                        passwd = hash(passwd);
                        var new_user = new user({ "name": name, "passwd": passwd });
                        new_user.save((err, user) => {
                            if (err) log(err)
                            else {
                                log("User " + user.name + " added in database")
                                res.status(201).json(new_user.toJSON()).end();
                            }
                        });
                    }
                    else res.status(409).json({error: "Username already taken"}).end()
                });
            }
            else res.status(411).json({error: "Password must be at least 8 characters long"}).end()
        }
        else res.status(411).json({error: "Username must be at least 3 characters long"}).end()
    }
    else res.status(400).json({error: "All fields must be completed"}).end()
})

app.get("/api/user", (req, res) => {
    log("[GET] /api/user")
    user.find({}, (err, data) => {
        if (err) log(err)
        if (data != "[]") res.status(200).json(data).end()
        else res.status(404).end()
    })
})

app.get("/api/user/:_id", (req, res) => {
    var id = req.params._id;
    log("[GET] /api/user/" + id)
    user.findById(id, (err, data) => {
        if (err) {res.status(404).json({error: "Incorrect id"}); return;};
        if (data != undefined) {res.status(200).json(data); return;}
        else {res.status(404).json({error: "Incorrect id"}); return;};
    })
})

app.post("/api/user/check", (req, res) => {
    var id = req.body.id
    log("[GET] /api/user/check")
    var passwd = req.body.passwd
    if (id != null && passwd != null){
        user.findById(id, (err, data) => {
            if (err) log(err)
            else if (data == null) res.status(401).end()
            else {
                if (data.passwd == hash(passwd)) res.status(200).end()
                else res.status(401).end()
            }
        })
    }else{
        res.status(401).end()
    }
})

app.post("/api/user/edit", (req, res) => {
    var id = req.body.id
    var passwd = req.body.passwd
    var new_passwd = req.body.new_passwd
    if (id != null & passwd != null & new_passwd != null){
        user.findById(id, (err, data) => {
            if (err) log(err)
            else if (data == null) res.status(404).json({error: "Incorrect id"}).end()
            else {
                if (data.passwd == hash(passwd)){
                    if (new_passwd.length >= 8){
                        user.updateOne({ _id: id }, { passwd: hash(new_passwd) }, (err, datas) => {
                            if (err) {
                                log(err)
                                res.status(400).json({ error: "A error occured" }).end()
                            } else {
                                res.status(200).end()
                            }
                        })
                    }else{
                        res.status(411).json({ error: "Password must be at least 8 characters long" }).end()
                    }
                }else{
                    res.status(401).json({ error: "Incorrect password" }).end()
                }
            }
        })
    }
    return;
})

app.delete("/api/user/", (req, res) => {
    var id = req.body.id_user
    log("[DELETE] /api/user/")
    user.findByIdAndDelete(id, (err, data) => {
        if (err) {
            console.log(err)
            res.status(400).json({ error: "A error occured" }).end()
            return
        }
        if (data != null) {
            res.status(200).end()
            return
        }else{
            res.status(404).end()
            return
        }
    })
})

// POSTS

app.get("/api/post/:_id", (req, res) => {
    var id = req.params._id;
    log("[GET] /api/post/" + id)
    post.findById(id, (err, data) => {
        if (err) res.status(404).json({error: "Incorrect id"}).end();
        if (data != undefined) res.status(200).json(data).end()
        else res.status(404).json({error: "Incorrect id"}).end();
    })
})

app.post("/api/post", (req, res) => {
    log("[POST] /api/post")
    var id_author    = req.body.id_author;
    var text  = req.body.text;
    var sub_text  = req.body.sub_text;
    var color  = req.body.color;
    if (id_author != undefined && text != undefined && sub_text != undefined && color != undefined){
        if (text.length > 0){
            user.findById(id_author, (err, data) => { // vérifie qu'il existe bien un utilisateur avec cet id
                if (err) log(err)
                if (data != undefined) {
                    var new_post = new post({
                        id_author: id_author,
                        text: text,
                        sub_text: sub_text,
                        color: color
                    });
                    new_post.save((err, post) => {
                        if (err) log(err)
                        else {
                            current_post.find({ id_author: id_author }, async (err, data) => {
                                if (data.length == 0) {
                                    var new_current_post = new current_post({ id_author: id_author, id_post: post._id })
                                    new_current_post.save((err, current_post) => {
                                        if (err) log(err)
                                        else log(" - Current post inserted for this user")
                                    })
                                }
                            })
                            log("Post " + post._id + " added in database")
                            res.status(201).json(new_post.toJSON()).end()
                        }
                    })
                }
                else res.status(403).json({error: "Incorrect id"}).end()
            })    
        }
        else res.status(400).json({ error: "Text field must be filled" }).end()
    }
    else res.status(400).json({error: "All fields must be completed"})
})

app.get("/api/posts/:author", (req, res) => {
    var id_author = req.params.author;
    log("[GET] /api/posts/" + id_author)
    post.find({id_author: id_author}, (err, datas) => {
        if (datas != undefined) {
            if (datas.length > 0) res.status(200).json(datas).end()
            else res.status(404).end()
        }
        else res.status(404).end()
    })
})

app.get("/api/post/last/:author", (req, res) => {
    var id_author = req.params.author;
    log("[GET] /api/post/last/" + id_author)
    post.find({id_author: id_author}).sort({_id: -1}).limit(1).exec((err, datas) => {
        if (err) log(err)
        if (datas != undefined) {
            if (datas.length > 0) res.status(200).json(datas[0]).end()
            else res.status(404).end()
        }
        else res.status(404).end() 
    })
})

app.delete("/api/post/:_id", (req, res) => {
    var id_post = req.params._id;
    log("[DELETE] /api/post/" + id_post)
    // Check si le current_post et le post sont différent
    current_post.findOne({ id_post: id_post}, (err, data) => {
        if (err) res.status(400).json({error: "Incorrect id"}).end()
        else{
            if (data == null){ // C'est bon le post n'est pas associé à un current_post
                post.deleteOne({ _id: id_post }, (err, data) => {
                    if (err) log(err)
                    log("Post " + id_post + " deleted")
                    res.status(200).end()
                })
            }else{
                res.status(400).json({ error: "This post is used by a user" }).end()
            }
        }
    })
})

// CURRENT POST

app.get("/api/current/post/:_id", (req, res) => {
    var id_author = req.params._id;
    log("[GET] /api/current/post/" + id_author)
    current_post.findOne({ id_author: id_author }, (err, data) => {
        if (err) log(err);
        if (data != undefined) {
            post.findOne({ _id: data.id_post}, (err, post) => {
                if (err) log(err);
                if (post != null) {
                    res.status(200).json(post).end()
                }
                else res.status(404).end()
            })
        } 
        else res.status(404).end() 
    });

})

app.post('/api/current/post/', (req, res) => {
    var id_author = req.body.id_author;
    var id_post   = req.body.id_post;
    log("[POST] /api/current/post/")
    log("---    Oui je suis utilisé")
    var new_current_post = new current_post({ id_author: id_author, id_post: id_post })
    post.findById(id_post, (err, data_exist) => { // Vérifie que le post existe
        if (err || data_exist == null) res.status(400).json({error: "Incorrect id"})
        else{
            current_post.findOne({ "id_author": id_author }, (err, data) => { 
            if (data == null) { // C'est bon, aucune entrée de la db n'est déja mise pour cet user
                new_current_post.save((err, data) => {
                    if (err) log(err)
                    else {
                        log("Current post " + data._id + " added in database")
                        res.status(201).end();
                    }
                })
            }
            else res.status(409).json({error: "A field already exists for this user"}).end()
        })
        }
    })
})

app.put('/api/current/post/', (req, res) => {
    var id_author = req.body.id_author;
    var id_post   = req.body.id_post;
    log("[PUT] /api/current/post/")
    post.findById(id_post, (err, data_exist) => { // Vérifie que le post existe
        if (err || data_exist == null) res.status(400).json({error: "Incorrect id"})
        else{
            current_post.updateOne({ id_author: id_author}, {id_post: id_post}, (err, data) => {
                if (err) log(err)
                log(data)
                if (data.modifiedCount) {
                    log("Current post updated")
                    res.status(202).end()
                } else if (data.matchedCount == 0) { // Il n'existe pas de current_post pour cet user => on en crée un
                    var new_current_post = new current_post({ id_author: id_author, id_post: id_post })
                    new_current_post.save((err, data) => {
                        if (err) log(err)
                        else {
                            log("Current post (re)created in the database")
                            res.status(201).end()
                        }
                    })
                } 
                else if (data.matchedCount == 1 && data.modifiedCount == 0) {
                    log("Choosed post is already the current post")
                    res.status(409).json({ error: "But nothing happends" }) // doublon
                }
                else res.status(400).end()
            })
        }
    })
})

// Session

app.get("/api/session/:_id", (req, res) => {
    log("[GET] /api/session/")
    var id = req.params._id
    session.findOne({id_user: id}, (err, data) => {
        if (err) log(err)
        if (data != null) {
            res.status(200).json(data).end()
            return
        }else{
            res.status(404).end()
            return
        }
    })
})

app.post("/api/session/", (req, res) => {
    log("[POST] /api/session/")
    var id_user = req.body.id_user
    var secret = req.body.secret
    var new_session = new session({id_user: id_user, secret: secret})
    session.deleteOne({ id_user: id_user }) // Supprime l'ancienne session (si il y'en a une)
    new_session.save((err, session) => {
        if (err) {
            res.status(400).json({error: "A error occured"}).end()
        } else {
            log("Session for " + session.id_user + " added in database")
            res.status(201).end();
        }
    })
})

app.delete("/api/session/", (req, res) => {
    var secret = req.body.secret
    log("[DELETE] /api/session/")
    session.deleteOne({ secret: secret }, (err, data) => {
        if (err) console.log(err)
        if (data.deletedCount == 1) res.status(200).end()
        else res.status(404).end()
    })
})

// BACKGROUND

app.get("/api/background/:_id", (req, res) => {
    var id = req.params._id
    log("[GET] /api/background/" + id)
    background.findById(id, (err, data) => {
        if (err) log(err)
        if (data != []) {
            res.status(200).json(data).end()
            return
        }else{
            res.status(404).end()
            return
        }
    })
})

app.get("/api/backgrounds/:_id", (req, res) => {
    var id = req.params._id
    log("[GET] /api/backgrounds/" + id)
    background.find({id_author: id}, (err, data) => {
        if (err) log(err)
        if (data != []) {
            res.status(200).json(data).end()
            return
        }else{
            res.status(404).end()
            return
        }
    })
})

app.post("/api/background/", (req, res) => {
    log("[POST] /api/background/")
    var id_author = req.body.id_author
    var path = req.body.path
    var new_background = new background({id_author: id_author, path: path})
    new_background.save((err, background) => {
        if (err) {
            res.status(400).json({error: "A error occured"}).end()
        } else {
            current_background.find({ id_author: id_author }, async (err, data) => {
                if (data.length == 0) {
                    var new_current_background = new current_background({ id_author: id_author, id_background: background._id })
                    new_current_background.save((err, current_background) => {
                        if (err) log (err)
                        else log(" - Current background inserted for this user")
                    })
                }
            })
            log("Background for " + background.id_author + " with path " + background.path + " added in database")
            res.status(201).json(background).end();
        }
    })
})

app.delete("/api/background/", (req, res) => {
    var id = req.body.id_background
    log("[DELETE] /api/background/")
    background.findByIdAndDelete(id, (err, data) => {
        if (err) console.log(err)
        if (data != null) res.status(200).end()
        else res.status(404).end()
    })
})

// CURRENT BACKGROUND

app.get("/api/current/background/:_id", (req, res) => {
    var id_author = req.params._id;
    log("[GET] /api/current/background/" + id_author)
    current_background.findOne({ id_author: id_author }, (err, data) => {
        if (err) log(err);
        if (data != undefined) {
            background.findOne({ _id: data.id_background}, (err, post) => {
                if (err) log(err);
                if (post != null) {
                    res.status(200).json(post).end()
                }
                else res.status(404).end()
            })
        }
        else res.status(404).end() 
    });

})

app.put('/api/current/background/', (req, res) => {
    var id_author     = req.body.id_author;
    var id_background = req.body.id_background;
    log("[PUT] /api/current/background/")
    background.findById(id_background, (err, data_exist) => { // Vérifie que le background existe
        if (err || data_exist == null) res.status(400).json({error: "Incorrect id"})
        else{
            current_background.updateOne({ id_author: id_author}, {id_background: id_background}, (err, data) => {
                if (err) log(err)
                if (data.modifiedCount) {
                    log("Current background updated")
                    res.status(202).end()
                } else if (data.matchedCount == 0) { // Il n'existe pas de current_background pour cet user => on en crée un
                    var new_current_background = new current_background({ id_author: id_author, id_background: id_background })
                    new_current_background.save((err, data) => {
                        if (err) log(err)
                        else {
                            log("Current background (re)created in the database")
                            res.status(201).end()
                        }
                    })
                } 
                else if (data.matchedCount == 1 && data.modifiedCount == 0) {
                    log("Choosed background is already the current background")
                    res.status(409).json({ error: "But nothing happends" }) // doublon
                }
                else res.status(400).end()
            })
        }
    })
})


app.listen(port, (err) => {
    log("API started on port " + port)
})
module.exports = app;