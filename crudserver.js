const express = require('express');
const res = require('express/lib/response');
const mysql = require('mysql2/promise');
const propertiesReader = require('properties-reader');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { send } = require('express/lib/response');
const services = require('./services');

const app = express();

const properties = propertiesReader('database.properties');

const PORT = properties.get("port");

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.listen(PORT, () => {
    console.log("starting the crud server");
})

app.post('/register', async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await services.sqlQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 2)', 
        [req.body.username, hashPass, req.body.email]);

        const token = services.generateAccessToken(req.body.username);
        const rtoken = services.generateRefreshToken(req.body.username);
        res.send({ token: token, rtoken : rtoken });
    }
    catch(error){
        console.log(error);
        res.status(400).send("failed to create new user");
    }
})

app.post('/login', async function(req, res){
    try{
        const result = await services.sqlQuery('SELECT * FROM users WHERE username = ?', [req.body.username]);
        if(!result[0]){
            return res.status(400).send("user does not exist");
        }

        var validPass = await bcrypt.compare(req.body.password, result[0].password);
        if(validPass){
            const token = services.generateAccessToken(result[0].username);
            const rtoken = services.generateRefreshToken(result[0].username);
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

app.get('/users', services.authenticateToken, async function(req, res) {
    try{
        const result = await services.sqlQuery('SELECT username, email, role FROM users');
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to get users");
    }
})

app.get('/users/:username', services.authenticateToken, async function(req, res) {
    try{
        const result = await services.sqlQuery('SELECT username, email, role FROM users WHERE username = ?', [req.params.username]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send(`failed to find user ${req.params.username}`);
    }
})

app.post('/users', services.authenticateToken, async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await services.sqlQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 2)', 
        [req.body.username, hashPass, req.body.email]);
        res.send(`successfully added user ${req.body.username}`);
    }
    catch(error){
        console.log(error);
        res.send("failed to create new user");
    }
})

app.put('/users/:username', services.authenticateToken, async function(req, res) {

    var hashPass = await bcrypt.hash(req.body.password, 10);

    try{
        const result = await services.sqlQuery('UPDATE users SET username = ?, password = ?, email = ? WHERE username = ?;', 
        [req.body.username, hashPass, req.body.email, req.params.username]);
        res.send(`successfully updated user ${req.body.username}`);
    }
    catch(error){
        console.log(error);
        res.send(`failed to update user ${req.params.username}`);
    }
})

app.delete('/users/:username', services.authenticateToken, async function(req, res) {
    try{
        const result = await services.sqlQuery('DELETE FROM users WHERE username = ?', [req.params.username]);
        res.send(`successfully deleted user ${req.params.username}`);
    }
    catch(error){
        console.log(error);
        res.send(`failed to delete user ${req.params.username}`);
    }
})

app.get('/refreshtoken', async function(req, res){
    const rtoken = req.headers['x-access-token'];
    if(!rtoken){
        return res.status(401).send("no refresh token");
    }
    try{
        const decoded = jwt.verify(rtoken, properties.get("refresh_secret"));
        const username = decoded.username;
        const token = services.generateAccessToken(username);
        res.send(token);
    }
    catch(err){
        console.log(err);
        return res.status(401).send("invalid token");
    }
})