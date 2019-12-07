'use strict'

const EventEmitter = require('events').EventEmitter;
const express = require('express');
const card_router = express.Router();
const db_pool = require('./database').db_pool;

class Card extends EventEmitter {
    constructor() {
        super();
    }

    verify_card(card_name) {
        var self = this;
        db_pool.getConnection(function(err, conn) {
            if (err) {
                self.emit('verify_card', 0);
            } else {
                var query = 'SELECT id FROM cards where name=?';
                conn.query(query, [card_name], function(err, results, fields) {
                    if (results.length > 0) {
                        self.emit('verify_card', results[0].id);
                    } else {
                        self.emit('verify_card', null);
                    }
                });
            }
        })
    }
}

var card = new Card();

card_router.post('/verify', function(req, res) {
    card.once('verify_card', function(msg) {
        if (msg) {
            res.status(200).json({card_id: msg});
        } else {
            res.status(404).json({error: "Card not found"});
        }
    });
    card.verify_card(req.body.card_name);
});

exports.Card = Card;
exports.router = card_router;