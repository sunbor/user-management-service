const express = require('express');
const res = require('express/lib/response');
const mysql = require('mysql2/promise');
const propertiesReader = require('properties-reader');
const bodyParser = require('body-parser');

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

app.get('/users', async function(req, res) {
    try{
        const result = await sqlQuery('SELECT * FROM users');
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to get users");
    }
})

app.get('/users/:userId', async function(req, res) {
    try{
        const result = await sqlQuery('SELECT * FROM users WHERE userId = ?', [req.params.userId]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to find user with id ${req.params.userId}");
    }
})

app.post('/users', async function(req, res) {
    try{
        const result = await sqlQuery('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', 
        [req.body.username, req.body.password, req.body.email, req.body.role]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to create new user");
    }
})

app.put('/users/:userId', async function(req, res) {
    try{
        const result = await sqlQuery('UPDATE users SET username = ?, password = ?, email = ?, role = ? WHERE userid = ?;', 
        [req.body.username, req.body.password, req.body.email, req.body.role, req.params.userId]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to update user with id ${req.params.userId}");
    }
})

app.delete('/users/:userId', async function(req, res) {
    try{
        const result = await sqlQuery('DELETE FROM users WHERE userId = ?', [req.params.userId]);
        res.send(result);
    }
    catch(error){
        console.log(error);
        res.send("failed to delete user with id ${req.params.userId}");
    }
})

async function sqlQuery(cmd, params){
    //console.log(params);
    const dbConnection = await mysql.createConnection(connProps);
    const [rows] = await dbConnection.execute(cmd, params);
    
    return rows;
}