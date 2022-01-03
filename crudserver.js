const express = require('express');
const res = require('express/lib/response');
const mysql = require('mysql2/promise');
const propertiesReader = require('properties-reader');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { send } = require('express/lib/response');

const app = express();

const properties = propertiesReader('database.properties');

const PORT = properties.get("port");

const connProps = {
    host: properties.get("host"),
    user: properties.get("user"),
    password: properties.get("password"),
    database: properties.get("database")
};

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.listen(PORT, () => {
    console.log("starting the crud server");
})

function generateAccessToken(username){
    return jwt.sign({ username: username }, properties.get("access_secret"), { expiresIn: properties.get("access_timeout") });
}

function generateRefreshToken(username){
    return jwt.sign({ username: username }, properties.get("refresh_secret"), { expiresIn: properties.get("refresh_timeout") });
}

function authenticateToken(req, res, next){
    const token = req.headers['x-access-token'];
    if(!token){
        return res.status(401).send("no token");
    }

    try{
        const decoded = jwt.verify(token, properties.get("access_secret"));
        req.user = decoded;
    }
    catch(err){
        console.log(err);
        return res.status(401).send("invalid token");
    }
    
    return next();
}

app.get('/refreshtoken', async function(req, res){
    const rtoken = req.headers['x-access-token'];
    if(!rtoken){
        return res.status(401).send("no refresh token");
    }
    try{
        const decoded = jwt.verify(rtoken, properties.get("refresh_secret"));
        const username = decoded.username;
        const token = generateAccessToken(username);
        res.send(token);
    }
    catch(err){
        console.log(err);
        return res.status(401).send("invalid token");
    }
})

app.post('/register', async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await sqlQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 2)', 
        [req.body.username, hashPass, req.body.email]);

        const token = generateAccessToken(req.body.username);
        const rtoken = generateRefreshToken(req.body.username);
        res.send({ token: token, rtoken : rtoken });
    }
    catch(error){
        console.log(error);
        res.status(400).send("failed to create new user");
    }
})

app.post('/login', async function(req, res){
    try{
        const result = await sqlQuery('SELECT * FROM users WHERE username = ?', [req.body.username]);
        if(!result[0]){
            return res.status(400).send("user does not exist");
        }

        var validPass = await bcrypt.compare(req.body.password, result[0].password);
        if(validPass){
            const token = generateAccessToken(result[0].username);
            const rtoken = generateRefreshToken(result[0].username);
            res.send({ token: token, rtoken : rtoken });
        }
        else{
            return res.send("invalid password");
        }
    }
    catch(error){
        console.log(error);
        res.send("failed to login");
    }
})

app.get('/users', authenticateToken, async function(req, res) {
    try{
        const result = await sqlQuery('SELECT username, email, role FROM users');
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to get users");
    }
})

app.get('/users/:username', authenticateToken, async function(req, res) {
    try{
        const result = await sqlQuery('SELECT username, email, role FROM users WHERE username = ?', [req.params.username]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send(`failed to find user ${req.params.username}`);
    }
})

app.post('/users', authenticateToken, async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await sqlQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 2)', 
        [req.body.username, hashPass, req.body.email]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to create new user");
    }
})

app.put('/users/:username', authenticateToken, async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await sqlQuery('UPDATE users SET username = ?, password = ?, email = ? WHERE username = ?;', 
        [req.body.username, hashPass, req.body.email, req.params.username]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send(`failed to update user ${req.params.username}`);
    }
})

app.delete('/users/:username', authenticateToken, async function(req, res) {
    try{
        const result = await sqlQuery('DELETE FROM users WHERE username = ?', [req.params.username]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send(`failed to delete user ${req.params.username}`);
    }
})

async function sqlQuery(cmd, params){
    //console.log(params);
    const dbConnection = await mysql.createConnection(connProps);
    const [rows] = await dbConnection.execute(cmd, params);
    
    return rows;
}