'use strict'

const EventEmitter = require('events').EventEmitter;
const express = require('express');
const deck_router = express.Router();
const db = require('./database');

class Deck extends EventEmitter {
    constructor() {
        super();
    }

    async get_deck(deck_id) {
        var query = 'SELECT d.card_id, d.amount, c.card_name FROM decks AS d JOIN cards AS c ON c.id = d.card_id WHERE d.deck_id=?';
        var result = await db.executeQuery(query, [deck_id]);
        if (result.length > 0) {
            self.emit('get_deck', results);
        } else {
            self.emit('get_deck', {error: 'Unable to get deck'});
        }
    }

    async create_deck(user_id, deck_name, cards) {
        var deck_id_result = await db.executeQuery('SELECT MAX(deck_id) AS deck_id FROM decks');
        var deck_id = deck_id_result[0].deck_id ? results[0].deck_id + 1 : 1;

        var create_query = 'INSERT INTO user_decks (user_id, deck_id, deck_name) VALUES (?, ?, ?)';
        var create_result = await db.executeQuery(create_query, [user_id, deck_id, deck_name]);

        if (!create_result) {
            this.emit('create_deck', {error: 'Unable to create deck'});
            return;
        }

        var query = 'INSERT INTO decks (deck_id, card_id, amount) VALUES\n';
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            query += `('${deck_id}', '${card.card_id}', '${card.amount}')`;
            if (i != cards.length - 1) {
                query += ',';
            }
        }
        var result = await db.executeQuery(query);

        if (result) {
            // Query executed, send the deck_id
            this.emit('create_deck', {deck_id: deck_id});
        } else {
            this.emit('create_deck', {error: 'Unable to create deck'});
        }
    }

    async delete_deck(user_id, deck_id) {
        var delete_query = `
        DELETE FROM user_decks WHERE user_id=? AND deck_id=?;
        DELETE FROM decks WHERE deck_id=?;
        `;
        var result = await db.executeQuery(delete_query, [user_id, deck_id, deck_id]);

        if (result) {
            this.emit('delete_deck', 1);
        } else {
            this.emit('delete_deck', 0);
        }
    }
}

var deck = new Deck();

deck_router.get('/:deckId', function(req, res) {
    deck.once('get_deck', function(msg) {
        res.json(msg);
    });
    deck.get_deck(req.params.deckId);
});

deck_router.post('/', function(req, res) {
    deck.once('create_deck', function(msg) {
        if (msg.error) {
            res.status(500).json(msg.error);
        } else {
            res.json(msg);
        }
    });
    var user_id = req.body.user_id;
    var deck_name = req.body.deck_name;
    var cards = req.body.cards;
    deck.create_deck(user_id, deck_name, cards);
});

deck_router.delete('/:deckId', function(req, res) {
    var user_id = req.body.user_id;
    deck.once('delete_deck', function(msg) {
        if (msg == 1) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });
    deck.delete_deck(user_id, req.params.deckId);
});

exports.Deck = Deck;
exports.router = deck_router;