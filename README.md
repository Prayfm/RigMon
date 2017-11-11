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

Download and install Node.js

https://nodejs.org/en/download/

Clone or download this repository

### Configuring config.json ###

Open `config.json` with your favorite text editor

Specify your currency and symbol here:

```
"currency": "usd"
"currency_symbol": "$"
```

You can use any currency you see on https://coinmarketcap.com, you have to use lowercase letters.

Specify your power cost per kW (for example, 0.09 is 9 cents for 1 kilowatthour)

`"electricity": 0.09`

Replace TELEGRAMBOT_TOKEN with your Telegram Bot token here:

`"token": "TELEGRAMBOT_TOKEN"`

## How to get Telegram Token

Talk to the BotFather https://telegram.me/botfather

Write /newbot and follow the instructions

You should get your token like this:
```
Use this token to access the HTTP API:
488814350:AAFxmfas0zOKSmDaAgAierd90-v8h_LKeF8
```
## Configuring your mining rigs

Sample configuration:

```
"clay": [
        {
            "name": "rig1",
            "host": "192.168.1.2",
            "port": 3333,
            "comments": "loginName/password",
            "power": 510,
            "coin": "ETH",
            "algo": "eth"
        }
]
```

Use `"clay":` for rigs using Claymore miner

Use `"ewbf":` for rigs using EWBF miner

Change host and port address to what you set up as your miners API.
```
"host": "127.0.0.1"
"port": 3333
```
Default values for Claymore is port 3333, EWBF is port 42000.

Use IP 127.0.0.1 if you are mining on this computer.

You can reference your rig with any comments you like, I put my remote login and password here.

`"comments": "comment"`

Put your power from the wall here in watts, for profit calculation:

`"power": 820`

Put the coin shortname and algorithm you are mining with this rig here:

`"coin": "ETH"`

`"algo": "eth"`

Currently available algos are: 

```
eth - Ethereum
eq - Equihash
cn - CryptoNight
```

## First time run

Don't forget to install Node.js

Open up your command prompt or terminal and navigate to your directory

(Easy way to open Command Prompt is to shift+right click inside the folder)

Navigate to your directory using 

```
cd *your directory*
for example:
cd C:/Users/User/rigmon
```

Then, run these commands

```
npm install
npm start
```

npm install will install required dependancies for this script and npm start will run it.

After running npm start for the first time, you have to send a direct message to the bot:

`/id`

You will receive your chat id which you will have to put to the config file here:

`"chatid": 123456`

It will enable monitoring of your rigs, in case it gets offline or stuck, you will receive a notification.

Each time you make a change to the config file, you will have to restart the bot.

Use ctrl+c to stop the running script and start it again.

You can also add your bot to a group chat and get an /id there.

## Exchange API keys

Currently supported exchanges:

Poloniex

Bittrex

Use the read-only API key without any access to trading.

This program uses the keys only to get your balance and withdrawal/deposit history.

Put your API keys here:

```
    "poloniex": {
        "key": "YOUR_API_KEY_POLONIEX",
        "secret": "YOUR_SECRET_KEY_POLONIEX"
    },
    "bittrex": {
        "key" : "YOUR_API_KEY_BITTREX",
        "secret" : "YOUR_SECRET_KEY_BITTREX"
    }
```

### Available commands ###

```
Simple commands:

/status
Displays the current status of all rigs.
/detailed
Displays more information, like temps and power usage (for EWBF).
/pools
Displays current pool servers.
/ip
Displays current ip addresses of rigs.
/profit
Displays current profit taken from whattomine.com, including electricity costs.

Exchange commands (needs an API key):

/balances
Returns balances for your account.
/history
Returns withdrawal and deposit history for the last week.
```