const express = require('express');
const res = require('express/lib/response');
const mysql = require('mysql2/promise');
const propertiesReader = require('properties-reader');

const app = express();

const properties = propertiesReader('database.properties');

const PORT = properties.get("port");

const connProps = {
    host: properties.get("host"),
    user: properties.get("user"),
    password: properties.get("password"),
    database: properties.get("database")
};

app.listen(PORT, () => {
    console.log("starting the crud server");
})

app.get('/users', async function(req, res) {

    const result = await sqlQuery('SELECT * FROM users');
    res.send(result);

})

app.get('/users/:userId', async function(req, res) {
    console.log(req.params.userId);
    const result = await sqlQuery('SELECT * FROM users WHERE userId = ?', [req.params.userId]);
    res.send(result);

})



async function sqlQuery(cmd, params){
    console.log(params);
    const dbConnection = await mysql.createConnection(connProps);
    const [rows] = await dbConnection.execute(cmd, params);
    
    return rows;
}