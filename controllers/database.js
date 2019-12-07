'use strict'

const EventEmitter = require('events').EventEmitter;
const mysql = require('mysql');
const request = require('request');

const dbConfig = require('../database.json');

const pool = mysql.createPool(dbConfig);

function executeQuery(queryString, args) {
    return new Promise(function(resolve, reject) {
        pool.getConnection(function(err, conn) {
            if (err) {
                reject(err);
            }
            args = args || [];
            var query = conn.query(queryString, args, function(err, results, fields) {
                if (err) {
                    reject(err);
                } else {
                    conn.release();
                    resolve(results);
                }
            });
            console.log(query.sql);
        });
    }).catch((err) => {
        console.error(err);
    });
}

class Database extends EventEmitter {
    constructor() {
        super();
    }

    async loadAllCards() {
        var cards = require('../scryfall-default-cards.json');
        var chunks = this.chunk(cards, 1000);
        var i = 0;
        var res = await this.loadCards(chunks[i++]);
        var all = [res]
        while (i < chunks.length) {
            res = await this.loadCards(chunks[i++]);
            all.concat(res.data)
        }
        return all
    }

    chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
    );

    async loadCards(chunk) {
        return new Promise(function(resolve, reject) {
            var data = chunk
            pool.getConnection(function(err, conn) {
                // Create our SQL query
                var query = 'INSERT INTO cards (tcgplayer_id, name, set_code, image_url, price) VALUES\n';
                for (var i = 0; i < data.length; i++) {
                    var card = data[i];

                    var tcgplayer_id = conn.escape(card.tcgplayer_id);
                    var cardName = conn.escape(card.name);
                    var set = conn.escape(card.set.toUpperCase());
                    var image = card.image_uris ? card.image_uris.large : "";
                    image = conn.escape(image);
                    var price = conn.escape(card.prices ? card.prices.usd : null);

                    query += `(${tcgplayer_id}, ${cardName}, ${set}, ${image}, ${price})`;

                    if (i != data.length - 1) {
                        query += ',\n';
                    }
                }
                //console.log(query);
                conn.query(query, function(err, results) {
                    if (err) {
                        reject(err);
                    }
                    conn.release();
                    resolve(data);
                });
            });
        });
    }
    
    async loadAllCardsApi() {
        var base_url = 'https://api.scryfall.com/cards/search?q=lang:en';
        var res = await this.loadCardsApi(base_url);
        var all = [res.data];
        var page = 2;
        while (res.has_more) {
            res = await this.loadCardsApi(res.next_page);
            page++;
            all.concat(res.data);
        }
        console.log('We do not have more cards to load');
        return all;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async loadCardsApi(url) {
        var self = this;
        return new Promise(function(resolve, reject) {
            console.log('Requesting data from URL ' + url);
            request.get(url, function(err, resp, body) {
                if (err) {
                    reject(err);
                } else {
                    if (resp.statusCode != 200) {
                        console.log('We did not get a status code we wanted');
                    }
                    var json = JSON.parse(body);
                    var cards = json.data;
                    pool.getConnection(async function(err, conn) {
                        if (err) {
                            reject(err);
                        } else {
                            var query = 'INSERT INTO cards (scryfall_id, name, set_code, image_url) VALUES\n';
                            var price_query = 'INSERT INTO card_prices (card_id, price, price_date) VALUES\n';
                            var date = new Date();
                            var prices = [];
                            for (var i = 0; i < cards.length; i++) {
                                var card = cards[i];

                                var scryfall_id = conn.escape(card.id);
                                var cardName = conn.escape(card.name);
                                var set = conn.escape(card.set.toUpperCase());
                                var image = card.image_uris ? card.image_uris.large : "";
                                image = conn.escape(image);
                                var price = card.prices;
                                if (price && price.usd) {
                                    prices.push(conn.escape(price.usd));
                                } else {
                                    prices.push(conn.escape("0.00"));
                                }
                                query += `(${scryfall_id}, ${cardName}, ${set}, ${image})`;

                                if (i != cards.length - 1) {
                                    query += ',\n';
                                }
                            }
                            var results = await executeQuery(query);
                            var card_id = results.insertId; // This is the first ID
                            var num_inserted = results.affectedRows;
                            for (var i = 0; i < num_inserted; i++) {
                                var card_price = prices[i];
                                price_query += `(${conn.escape(card_id + i)}, ${card_price}, ${conn.escape(date)})`;
                                if (i != num_inserted - 1) {
                                    price_query += ',\n';
                                }
                            }
                            var price_results = await executeQuery(price_query);
                            // Delay per API guidelines to avoid timeouts
                            await self.sleep(500);
                            conn.release();
                            resolve(json);
                        }
                    });
                }
            });
        });
    }
}

exports.Database = Database;
exports.db_pool = pool;
exports.executeQuery = executeQuery;