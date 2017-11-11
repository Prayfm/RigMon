const   config = require('./config.json'),
        TelegramBot = require('node-telegram-bot-api'),
        claymore = require('./claymore.js'),
        ewbfmonitor = require('./ewbf.js'),
        Poloniex = require('./poloniex'),
        moment = require('moment'),
        bittrex = require('node-bittrex-api'),
        https = require('https');
        Poloniex.STRICT_SSL = false;

const   bot = new TelegramBot(config.token, {polling: true});        
        
var ison = new Array();
var oldon = new Array();
var algos = ["Ethash","Equihash","CryptoNight","ClayDual"],
    wtmal = ["","",""],
    suf   = ["MH/s","H/s","H/s","MH/s"];

var poloniex = new Poloniex(
        config.poloniex.key,
        config.poloniex.secret
    );
    
    bittrex.options({
        'apikey' : config.bittrex.key,
        'apisecret' : config.bittrex.secret
    });

if(config.token != 0)
setInterval(function(){
    a = ewbfmonitor.getData();
    b = claymore.getData();
    all = a.concat(b);
    any = false;
    msgtext = "<pre>";
    if(all.length>0){
        for (var j in all) {
            if(all[j].error == null) {
                ison[j] = true;
            } else {
                ison[j] = false;
            }
        }
        for (var j in ison) {
            if(ison[j] != oldon[j]) {
                if(ison[j]){
                    console.log(all[j].name+" online "+Date())
                    msgtext = msgtext + all[j].name + " is online\n";
                }
                else{
                    msgtext = msgtext + all[j].name + " is offline, e:" + all[j].error + "\n";
                    console.log(all[j].name+" offline "+Date());
                };
                any = true;   
            }
        }
        oldon = Object.assign({},ison);
    }
    msgtext = msgtext + "</pre>";
    if(any){
        bot.sendMessage(config.chatid,text=msgtext,{parse_mode : "HTML"});
    }
},config.miner_poll);

bot.onText(/\/id/, (msg) => {    
    bot.sendMessage(msg.chat.id,text="<pre>Your chat ID is: "+msg.chat.id+"</pre>",{parse_mode : "HTML"}); 
});

bot.onText(/\/help/, (msg) => {    
    bot.sendMessage(msg.chat.id,text="<pre>Available commands:\n/status, /detailed, /pools, /ip, /profit\nExchange commands:\n/balances, /history</pre>",{parse_mode : "HTML"});
});

bot.onText(/\/ip/, (msg) => {
    msgtext = "<pre>IP LIST\n";
    for(var f in all) {
        rig = all[f];
        msgtext = msgtext + rig.name + ": " + rig.host + " " + rig.comments + "\n";
    }
    msgtext = msgtext + "</pre>";
    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
});

bot.onText(/\/pools/, (msg) => {
    msgtext = "<pre>POOL LIST\n";
    for(var f in all) {
        rig = all[f];
        msgtext = msgtext + rig.name + ": " + rig.pools + " " + rig.ver + "\n";
    }
    msgtext = msgtext + "</pre>";
    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
});

bot.onText(/\/status/, (msg) => {    
    msgtext = "<pre>STATISTICS \n";
    rigs = Object.assign({},all);
    for(var f in rigs) {
        rig = rigs[f];
        msgtext = msgtext + f + ":" + rig.name + " | "
        if(rig.error === null) {
            time = moment.unix(rig.uptime);
            up = moment(time).toNow(true);
            if (rig.hash2 > 0) {
                msgtext = msgtext + (rig.hash/1000).toFixed(2) + " MH/s, " + (rig.hash2/1000).toFixed(2) + "MH/s, up:" + up + "\n";
            } else {
                if (rig.hash > 10000){
                msgtext = msgtext + (rig.hash/1000).toFixed(2) + " MH/s, up:" + up + "\n"; 
                } else{
                    msgtext = msgtext + rig.hash + " H/s, up:" + up + "\n";    
                }
            }
        } else {
            time = moment.unix(rig.last_seen);
            last = moment(time).fromNow();
            msgtext = msgtext + rig.error + ", last seen:" + last + "\n";
        }
    }
    msgtext = msgtext + "</pre>";
    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});    
});

bot.onText(/\/profit/, (msg) => {
    rigs = Object.assign({},all);    
    msgtext = "<pre>PROFIT \n";
    power = [0,0,0,0];
    hash = [0,0,0,0];
    for(var f in rigs) {
        rig = rigs[f];     
        if(rig.error == null) {
            if (rig.algo == "eth"){
                hash[0] = hash[0] + rig.hash*1;
                hash[3] = hash[3] + rig.hash2*1;
                power[0] = power[0] + rig.power*1;
                wtmal[0] = "&eth=true&factor%5Beth_hr%5D=";
            } 
            if (rig.algo == "eq"){
                hash[1] = hash[1] + rig.hash*1;
                power[1] = power[1] + rig.power*1;
                wtmal[1] = "&eq=true&factor%5Beq_hr%5D=";
            }      
            if (rig.algo == "cn"){
                hash[2] = hash[2] + rig.hash*1;
                power[2] = power[2] + rig.power*1;
                wtmal[2] = "&cn=true&factor%5Bcn_hr%5D=";
            }      
        }
    }
    allpower = 0;
    for(var f in power){
        allpower = allpower+power[f];
    }
    allpower = allpower/1000;
    hash[0] = hash[0]/1000;
    hash[3] = hash[3]/1000;
    kwprice = config.electricity;
    e = config.currency_symbol;
    for(var f in algos){
        if(hash[f]>0){
            if(f == 0) 
                msgtext = msgtext + algos[f] + ": " + hash[f].toFixed(2) + suf[f] + ", " + power[f] + "W, " + (hash[f]*1000/power[f]).toFixed(2) + "H/w\n"
                + "Power: d:" + (power[f]*kwprice*24/1000).toFixed(2) + e + " w:" + (power[f]*kwprice*24*7/1000).toFixed(2) + e + " m:" + (power[f]*kwprice*24*30/1000).toFixed(2) + e + "\n";
            if(f ==1 || f == 2) 
                msgtext = msgtext + algos[f] + ": " + hash[f] + suf[f] + ", " + power[f] + "W, " + (hash[f]/power[f]).toFixed(2) + "H/w\n"
                + "Power: d:" + (power[f]*kwprice*24/1000).toFixed(2) + e + " w:" + (power[f]*kwprice*24*7/1000).toFixed(2) + e + " m:" + (power[f]*kwprice*24*30/1000).toFixed(2) + e + "\n";
        }
    }
    msgtext = msgtext + "Total expenses for power: " + allpower.toFixed(2) + "kW\n";
    msgtext = msgtext + "d:" + (allpower*kwprice*24).toFixed(2) + e + " w:" + (allpower*kwprice*24*7).toFixed(2) + e + " m:" + (allpower*kwprice*24*30).toFixed(2) + e + "\n";
    wtmpath = "https://whattomine.com/coins.json?utf8=%E2%9C%93";
    for(var f in wtmal){
        if(hash[f]>0){
            wtmpath = wtmpath + wtmal[f] + hash[f];
        }        
    };
    coinpath = "https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert="+config.currency;
    let price = '';
    let profits = '';
    https.get(wtmpath, (res) => {
        res.on('data', (chunk) => {
            profits += chunk;
        });
        res.on('end', () => {
            profits = JSON.parse(profits);
            https.get(coinpath, (res) => {
                res.on('data', (chunk) => {
                    price += chunk;
                });
                res.on('end', () => {
                    ccurr = "price_" + config.currency;
                    price = JSON.parse(price);
                    btc = price[0][ccurr]; 
                    msgtext = msgtext + "Revenue:\n";
                    ethtext = "Ethash:\n";
                    eqtext = "Equihash:\n";
                    cntext = "CryptoNight:\n";
                    for (var key in profits["coins"]) {
                        var profit = profits["coins"][key];
                        pr = profit.tag;
                        if(pr.length<6)pr=pr+"    ";
                        if(pr.length>5)pr=pr.substr(0,5);
                        if(profit.algorithm == "Ethash") ethtext = ethtext + pr + " | d:" + (profit.btc_revenue24*btc).toFixed(2) + e + ", w:" + (profit.btc_revenue24*btc*7).toFixed(0) + e + ", m:" + (profit.btc_revenue24*btc*30).toFixed(0) + e + "\n";
                        if(profit.algorithm == "Equihash") eqtext = eqtext + pr + " | d:" + (profit.btc_revenue24*btc).toFixed(2) + e + ", w:" + (profit.btc_revenue24*btc*7).toFixed(0) + e + ", m:" + (profit.btc_revenue24*btc*30).toFixed(0) + e + "\n";
                        if(profit.algorithm == "CryptoNight") cntext = cntext + pr + " | d:" + (profit.btc_revenue24*btc).toFixed(2) + e + ", w:" + (profit.btc_revenue24*btc*7).toFixed(0) + e + ", m:" + (profit.btc_revenue24*btc*30).toFixed(0) + e + "\n";    
                    };
                    if (hash[0] > 0){
                        msgtext = msgtext + ethtext;
                        peth = profits.coins.Ethereum.btc_revenue24*1} else {peth=0};
                    if (hash[1] > 0){                        
                        msgtext = msgtext + eqtext;
                        peq = profits.coins.Zcash.btc_revenue24*1} else {peq=0};
                    if (hash[2] > 0){
                        msgtext = msgtext + cntext;
                        pecn = profits.coins.Monero.btc_revenue24*1} else {pecn=0};             
                    dayprofit = (pecn+peq+peth)*btc - allpower*kwprice*24;
                    msgtext = msgtext + "ZEC+ETH+XMR-Electricity:\nd:" + dayprofit.toFixed(2) + e + ", w:" + (dayprofit*7).toFixed(2) + e + "\nm:" + (dayprofit*30).toFixed(2) + e + ", y:" + (dayprofit*365).toFixed(2) + e + "</pre>";
                    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});                    
                });
            }).on("error", (err) => {
                console.log("er: " + err.message);
                msgtext = "<pre>coinmarketcap.com err: " + err.message + "</pre>";
                bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});  
            });
        });
    }).on("error", (err) => {
        console.log("er: " + err.message);
        msgtext = "<pre>whattomine.com err: " + err.message + "</pre>";
        bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
    });    
});

bot.onText(/\/detailed/, (msg) => {
    rigs = Object.assign({},all);
    msgtext = "<pre>DETAILED STATISTICS \n";
    for(var f in rigs) {
        rig=rigs[f];
        msgtext = msgtext + rig.name;
        if(rig.error == null) {
            msgtext = msgtext + " | " + (rig.hash/rig.power).toFixed(2) + "H/W" + "\n";
            for(var j in rig.gpu){
                gpu = rig.gpu[j];
                if (rig.ver.slice(-3) == "EWB"){
                    msgtext = msgtext + "  " + gpu.hash + " H/s " + gpu.temps + "c " + gpu.power + "W " + (gpu.hash/gpu.power).toFixed(2) + "H/W\n"}
                if (rig.ver.slice(-3) == "ETH" ){
                    msgtext = msgtext + "  " + (gpu.hash/1000).toFixed(2) + " MH/s " + gpu.temps + "c " + gpu.fan + "% " + "\n";
                }                      
                if (rig.ver.slice(-3) == "ZEC" || rig.ver.slice(-3) == "XMR" ){
                    msgtext = msgtext + "  " + gpu.hash + " H/s " + gpu.temps + "c " + gpu.fan + "% " + "\n";
                }                         
            }            
        } 
        else {
           msgtext = msgtext + " | OFF\n"; 
        }
    };
    msgtext = msgtext + "</pre>";
    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"})  
});

bot.onText(/\/balances/, (msg) => {
    coinpath = "https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert="+config.currency;
    price = "";
    e = config.currency_symbol;
    https.get(coinpath, (res) => {
        res.on('data', (chunk) => {
            price += chunk;
            });
        res.on('end', () => {
            ccurr = "price_" + config.currency;
            price = JSON.parse(price);
            btc = price[0][ccurr]; 
            if(config.bittrex.key != ""){
                bittrex.getbalances( function( data, err ) {
                    if (err) {
                        console.error(err);                
                        msgtext = "<pre>bittrex.com err: " + err.message + "</pre>";
                        return;
                    };
                    msgtext = "<pre> BITTREX Balances:\n"
                    bittdata = data.result;
                    for (var i in bittdata) {
                        msgtext = msgtext + bittdata[i].Currency + ": " + bittdata[i].Balance.toFixed(8)+"\n";
                    };
                    msgtext = msgtext + "</pre>";
                    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
                    }
                )};
            if(config.poloniex.key != ""){
                poloniex.returnCompleteBalances(function(err, data){
                    if (err){
                        console.error(err);
                        msgtext = "<pre>poloniex.com err: " + err.message + "</pre>";
                        return;
                    }            
                    polodata = data;  
                    msgtext = "<pre> POLONIEX Balances:\n"
                    totalvalue = 0;
                    for (var key in polodata) {
                        var coin = polodata[key].available*1;
                        var coinbtc = polodata[key].btcValue*1;
                        var name = String(key);
                        if (coin > 0){
                            msgtext = msgtext + name + ": " + coin.toFixed(8) + ", " + (coinbtc*btc).toFixed(2) + e + "\n";
                        }
                        totalvalue = totalvalue + coinbtc*1;
                    };
                    totalvalue = totalvalue * btc;
                    msgtext = msgtext + "Total:" + totalvalue.toFixed(2) + e + "</pre>";
                    bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
                    });
                };
        }).on("error", (err) => {
            console.log("er: " + err.message);
            msgtext = "<pre>coinmarketcap.com err: " + err.message + "</pre>";
            bot.sendMessage(msg.chat.id,text=msgtext,{parse_mode : "HTML"});
        });        
    })   
});

bot.onText(/\/history/, (msg) => {
    timeNow = Math.floor(Date.now() / 1000);
    timeLastWeek = timeNow - 604800;
    var tLast = new Date(timeLastWeek*1000).toISOString();
    bittrex.getwithdrawalhistory({}, function( data, err ) {
        if (err) {
            console.error('E: BittrexW' + err);
            return;             
        };
        bittw = data.result;
        bittrex.getdeposithistory({}, function( data, err ) {
            if (err) {
                console.error('E: BittrexD:' + err);
                return
            };
            bittd = data.result;
            msgtext = "<pre> BITTREX WITHDRAWALS:\n";
            for (var i in bittw) {
                time = moment(bittw[i].Opened).fromNow();
                if (bittw[i].Opened > tLast) {
                    msgtext = msgtext + bittw[i].Currency + ": " + bittw[i].Amount + "\n to:" + bittw[i].Address + "\n date:" + time + "\n";
                }
            };
            msgtext = msgtext + " BITTREX DEPOSITS:\n";
            for (var i in bittd) {
                time = moment(bittd[i].LastUpdated).fromNow();
                if (bittd[i].LastUpdated > tLast) {
                    msgtext = msgtext + bittd[i].Currency + ": " + bittd[i].Amount + ", " + time + "\n";
                }
            };
            
            bot.sendMessage(msg.chat.id,text=msgtext+"</pre>",{parse_mode : "HTML"});
        });
    });
    poloniex.returnDepositsWithdrawals(timeLastWeek, timeNow, function(err, data){
        if (err){
            console.log('E: Poloniex:', err);
            return;
        }            
        polo = data;
        msgtext = "<pre> POLONIEX WITHDRAWALS:\n"; 
        for (var i in polo.withdrawals) {
            var tx = polo.withdrawals[i];
            time = moment(tx.timestamp*1000).fromNow();
            msgtext = msgtext + tx.currency + ": " + tx.amount + "\n to:" + tx.address + "\n date:" + time + "\n";
        };
        
        msgtext = msgtext + " POLONIEX DEPOSITS:\n";
        for (var i in polo.deposits) {
            var tx = polo.deposits[i];
            time = moment(tx.timestamp*1000).fromNow();
            msgtext = msgtext + tx.currency + ": " + tx.amount + ", " + time + "\n";
        };
        bot.sendMessage(msg.chat.id,text=msgtext+"</pre>",{parse_mode : "HTML"});
    });
});