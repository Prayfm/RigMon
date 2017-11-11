# RigMon #


### What is RigMon? ###

RigMon is a quick way to monitor your mining rigs using Telegram bot.

It currently supports:
* Claymore miners (Eth, Equihash, CryptoNight)
* EWBF miner

You can also check balance and transaction history in:
* Bittrex
* Poloniex

### How do I get set up? ###

* Download and install Node.js

https://nodejs.org/en/download/

* Clone or download this repository
* With a command line go to your folder and run

`npm install`

When you are finished with the config.json, you can run

`npm start`

### config.json ###
* Configuration

Open `config.json` with your favorite text editor

Specify your currency and symbol here:

You can use any currency you see on https://coinmarketcap.com, you have to use lowercase letters.

Replace your Telegram Bot token with TELEGRAMBOT_TOKEN here:

`"token": "TELEGRAMBOT_TOKEN",`



available algos: "eth", "cn", "eq"
* Dependencies
* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact