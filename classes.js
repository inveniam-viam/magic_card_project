'use strict'

var EventEmitter = require('events').EventEmitter;
var mysql = require('mysql');
const db = require('dotenv').config();
var con =  mysql.createConnection({ 
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

con.connect(function(err) { 
    if (err) {
        console.log("Error connecting to database.");
    }
    else {
        console.log("Database successfully connected!");
    }
});

class Database extends EventEmitter{
    constructor(){super();}
    login(username,password){
        var str = "select type from users where username="+con.escape(username) 
        + " AND  password=PASSWORD("+con.escape(password) +")";
        var self = this;
        con.query(str,
            function(err, rows, fields){
                if(err){
                    console.log('Error');
                    self.emit('loggedin',-1);
                }
                else{
                    if(rows.length>0)
                        self.emit('loggedin',1);
                    else
                        self.emit('loggedin',0);
                }
            }
        );
    }
    get UserTable(){
        var str = "select username, accountype from users order by username";
        var self = this;
        con.query(str,
            function(err, rows, fields){
                if(err){
                    console.log('Error');
                    self.emit('usertable',-1);
                }
                else{
                    self.emit('usertable',rows);
                }
            }
        )
    }
}
exports.Database = Database
