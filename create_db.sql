CREATE DATABASE IF NOT EXISTS magic_card_project_test;

USE magic_card_project_test;

CREATE TABLE cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scryfall_id VARCHAR(128) NOT NULL,
    name VARCHAR(200) NOT NULL,
    set_code VARCHAR(6) NOT NULL,
    image_url VARCHAR(300) NOT NULL
);

CREATE TABLE decks (
    deck_id INT NOT NULL,
    card_id INT NOT NULL,
    amount INT NOT NULL,
    UNIQUE (deck_id, card_id, amount)
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    account_type CHAR(1) NOT NULL -- 1 for normal user, 2 for admin
);

CREATE TABLE user_collections (
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    amount INT NOT NULL,
    UNIQUE (user_id, card_id, amount)
);

CREATE TABLE card_prices (
    card_id INT NOT NULL,
    price FLOAT NOT NULL,
    price_date DATE NOT NULL,
    UNIQUE (card_id, price, price_date)
);

CREATE TABLE user_decks (
    user_id INT NOT NULL,
    deck_id INT NOT NULL,
    deck_name VARCHAR(200) NOT NULL,
    UNIQUE (user_id, deck_id)
);