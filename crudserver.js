const express = require('express');
const mysql = require('mysql2');
const propertiesReader = require('properties-reader');

const app = express();

const properties = propertiesReader('database.properties');

const PORT = properties.get("port");

const connection = mysql.createConnection({
    host: properties.get("host"),
    user: properties.get("user"),
    password: properties.get("password"),
    database: properties.get("database")
})

app.listen(PORT, () => {
    console.log("starting the crud server");
})

app.get('/users', (req, res) => {
    connection.connect(error => {
        if(error){
            console.log("oh no!!");
            throw error;
        }
    })
    connection.query('SELECT * FROM users', (err, qRes, fields) => {
        console.log(qRes[0]);
        if(err){
            console.log("select user query failed");
        }

        res.send(qRes);

    });

    //res.send("hello from users");
})