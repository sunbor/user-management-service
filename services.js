const express = require('express');
const res = require('express/lib/response');
const mysql = require('mysql2/promise');
const propertiesReader = require('properties-reader');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { send } = require('express/lib/response');

const properties = propertiesReader('database.properties');

const connProps = {
    host: properties.get("host"),
    user: properties.get("user"),
    password: properties.get("password"),
    database: properties.get("database")
};

function generateAccessToken(username){
    return jwt.sign({ username: username }, properties.get("access_secret"), { expiresIn: properties.get("access_timeout") });
}

function generateRefreshToken(username){
    return jwt.sign({ username: username }, properties.get("refresh_secret"), { expiresIn: properties.get("refresh_timeout") });
}

//middleware
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

async function sqlQuery(cmd, params){
    //console.log(params);
    const dbConnection = await mysql.createConnection(connProps);
    const [rows] = await dbConnection.execute(cmd, params);
    
    return rows;
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    authenticateToken,
    sqlQuery
}