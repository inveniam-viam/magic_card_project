'use strict'

const EventEmitter = require('events').EventEmitter;
const express = require('express');
const user_router = express.Router();
const db = require('./database');

class User extends EventEmitter {
    constructor() {
        super();
    }

    async get_user(user_id) {
        var deck_query = 'SELECT deck_id, deck_name FROM user_decks WHERE user_id=?';
        var deck_results = await db.executeQuery(deck_query, [user_id]);
        
        var cards_query = 'SELECT uc.card_id, c.name, c.image_url, uc.amount FROM user_collections AS uc JOIN cards AS c ON c.id = uc.card_id WHERE uc.user_id=?';
        var cards_results = await db.executeQuery(cards_query, [user_id]);

        this.emit('user_info', {user_decks: deck_results, user_cards: cards_results});
    }

    /**
     * Adds a card to a user's collection
     * @param {int} user_id
     * @param {int} card_id 
     * @param {int} amount 
     */
    async add_card(user_id, card_id, amount) {
        var card_query = `INSERT INTO user_collections(user_id,card_id,amount) 
        VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE
        amount = VALUES(amount) + ?`;
        var result = await db.executeQuery(card_query, [user_id, card_id, amount, amount]);
        
        var affectedRows = result ? result.affectedRows : 0;

        if (affectedRows) {
            this.emit('add_card', 1);
        } else {
            this.emit('add_card', 0);
        }
    }

    async set_card_quantity(user_id, card_id, amount) {
        // We will set the quantity to the amount then delete the row if it's quantity is 0
        var card_query = `UPDATE user_collections SET amount=?
        WHERE user_id=? AND card_id=?
        `;
        var update_result = await db.executeQuery(card_query, [amount, user_id, card_id]);
        card_query = 'SELECT amount FROM user_collections WHERE user_id=? AND card_id=?';
        var new_amount_result = await db.executeQuery(card_query, [user_id, card_id]);
        var new_amount = new_amount_result[0].amount;
        if (new_amount == 0) {
            // Delete stuff
            await db.executeQuery('DELETE FROM user_collections WHERE user_id=? AND card_id=?', [user_id, card_id]);
        }

        if (update_result.affectedRows > 0) {
            this.emit('set_card_quantity', {code: 1, new_amount: new_amount});
        } else {
            this.emit('set_card_quantity', {code: 0});
        }
    }

    async get_prices(user_id, start_date, end_date) {
        var price_query = `
        SELECT c.id, c.name, (uc.amount * p.price) AS total, p.price_date
        FROM user_collections AS uc
        JOIN card_prices AS p on p.card_id = uc.card_id
        JOIN cards AS c on c.id = uc.card_id
        WHERE uc.user_id = ?
        AND p.price_date >= ? AND p.price_date <= ?
        `;
        var today = new Date().toISOString().split("T")[0];
        start_date = start_date || today;
        end_date = end_date || today;
        var results = await db.executeQuery(price_query, [user_id, start_date, end_date]);
        if (results.length > 0) {
            this.emit('get_prices', results);
        } else {
            this.emit('get_prices', {error: 'Unable to retrive pricing data for user\'s collection'});
        }
    }
}

var user = new User();

// Returns information about a user's collection
user_router.get('/:userId', function(req, res) {
    user.once('user_info', function(msg) {
        res.json(msg);
    });
    user.get_user(req.params.userId);
});

user_router.get('/:userId/prices', function(req, res) {
    user.once('get_prices', function(msg) {
        if (msg.error) {
            res.status(404).json(msg.error);
        } else {
            res.status(200).json(msg);
        }
    });
    var user_id = req.params.userId;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    user.get_prices(user_id, start_date, end_date);
});

user_router.post('/:userId', function(req, res) {
    user.once('add_card', function(msg) {
        if (msg == 1) {
            res.status(200).json({status: 'Card added successfully'});
        } else {
            res.status(500).json({error: 'Error adding card'});
        }
    });
    user.add_card(req.params.userId, req.body.card_id, req.body.amount);
})

user_router.put('/:userId', function(req, res) {
    user.once('set_card_quantity', function(msg) {
        if (msg.code == 1) {
            res.status(200).json({status: 'Card amount updated successfully', new_amount: msg.new_amount});
        } else {
            res.status(500).json({error: 'Error updating card amount'});
        }
    });
    user.set_card_quantity(req.params.userId, req.body.card_id, req.body.amount);
});

exports.User = User;
exports.router = user_router;