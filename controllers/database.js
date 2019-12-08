'use strict'
var EventEmitter = require('events').EventEmitter;
var mysql = require('mysql');
var db = require('dotenv').config();
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

    getInfo_login(request){
        var URL = 'http://localhost:8080/login';
        var self = this;
        request.get(URL, function(error, response, body){
            var json = JSON.parse(body);
            var username = json.username;
            var password = json.password;
            self.emit('loggedin',1);
        });
    }
    getInfo_register(request){
        var URL = 'http://localhost:8080/register';
        var self = this;
        request.get(URL, function(error,response,body){
            var json = JSON.parse(body);
            var username = json.username;
            var password = json.password;
            self.emit('register',1);
        });
    }

    login(username,password){
        var str = "select accounttype from users where username="+con.escape(username) 
        + " AND  password=PASSWORD("+con.escape(password)+");";
        var self = this;
        con.query(str,
            function(err, rows, fields){
                if(err){
                    console.log("Error: can't login");
                    self.emit('loggedin',-1);
                }
                else{
                    console.log("Logged in?");
                    if(rows.length>0)
                        self.emit('loggedin',1);
                    else
                        self.emit('loggedin',0);
                }
            }
        );
    }
    
    register(username,password){
        var str = "insert into users (username, password) values ("+con.escape(username) 
        + ", PASSWORD(" +con.escape(password)+"));"
        var self = this;
        con.query(str, function(err,rows, fields){
            if(err){
                console.log('Error');
                self.emit('Username and password cannot register',-1);
            }
            else{
                console.log('registration succcessful?')
                self.emit('register', 1);
            }
        });
    }

    getUserTable(){
        var str = "select username, accounttype from users order by username";
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
            })
    }
}
exports.Database = Database
