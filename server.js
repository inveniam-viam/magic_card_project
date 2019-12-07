const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const db_s = require('./controllers/database');
const db = new db_s.Database();
const users = require('./controllers/users').router;
const decks = require('./controllers/decks').router;
const cards = require('./controllers/cards').router;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(express.static('static/'));

app.use('/users', users);

app.use('/decks', decks);

app.use('/cards', cards);

app.post('/login', function(req, res) {

});

app.listen('8080', function() {
    console.log('Starting server...');
    // Load cards once
    //db.loadAllCardsApi();
});