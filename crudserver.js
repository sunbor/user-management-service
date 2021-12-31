const express = require('express');
const mysql = require('mysql2');
const propertiesReader = require('properties-reader');

const app = express();

const PORT = properties.get("port");

const properties = propertiesReader('database.properties');

const connection = mysql.createConnection({
    host: properties.get("host"),
    user: properties.get("user"),
    password: properties.get("password"),
    database: properties.get("database")
})

connection.connect(error => {
    if(error){
        console.log("oh no!!");
        throw error;
    }

    app.listen(PORT, () => {
        console.log("connected to server on port:", PORT);
    })
})

connection.query('SELECT * FROM users', (err, res, fields) => {
    console.log(res[0]);
});

// app.listen(3000, () => {
//     console.log("starting the crud server");
// })

// app.get('/', (req, res) => {
//     res.send("hello this is the crud server");
// })