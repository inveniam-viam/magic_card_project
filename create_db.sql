CREATE DATABASE IF NOT EXISTS magic_card_project_test;

USE magic_card_project_test;

CREATE TABLE Cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    set_code VARCHAR(4) NOT NULL
);

CREATE TABLE Decks (
    deck_id INT NOT NULL,
    card_id INT NOT NULL,
    amount INT NOT NULL
    UNIQUE (deck_id, card_id, amount)
);

CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    account_type CHAR(1) DEFAULT=1 -- 1 for normal user, 2 for admin
);

INSERT INTO Users (login, password, account_type)
VALUES ('admindaron', PASSWORD('admindaron'), 2);