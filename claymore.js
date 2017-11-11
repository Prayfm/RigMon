
// --------------- REQUESTER ---------------

var config = require('./config.json');
var net = require('net');

var clay = [];
clay.json = [];
lowhashcount = 0;


config.clay.forEach(function(item, i, arr) {

    // settings
    var m = clay[i] = {};
    var c = config.clay[i];
    var j = clay.json[i];

    m.name = c.name;
    m.host = c.host;
    m.port = c.port;
    m.poll = (typeof c.poll !== 'undefined') ? c.poll : config.miner_poll;
    m.timeout = (typeof c.timeout !== 'undefined') ? c.timeout : config.miner_timeout;

    function hostname() {
        return c.hostname ? c.hostname : (m.host + ':' + m.port);
    }

    // stats
    m.reqCnt = 0;
    m.rspCnt = 0;

    // it was never seen and never found good yet
    c.last_seen = null;
    c.last_good = null;

    // socket
    m.socket = new net.Socket()

    .on('connect', function() {
        var req = '{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}';
        ++m.reqCnt;
        m.socket.write(req + '\n');
        m.socket.setTimeout(m.timeout);
    })

    .on('timeout', function() {
        m.socket.destroy();
        clay.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : "",
            "pools"      : "",
            "ver"        : "",
            "comments"   : c.comments,
            "offline"    : c.offline,
            "warning"    : null,
            "error"      : 'Error: no response',
            "power"      : "",
            "gpu"        : [],
            "last_seen"  : c.last_seen ? c.last_seen : 0
        };
    })

    .on('data', function(data) {
        ++m.rspCnt;
        c.last_seen = Math.floor(Date.now() / 1000);
        m.socket.setTimeout(0);
        var d = JSON.parse(data);        
        eth = d.result[2].split(';');
        dcr = d.result[4].split(';');
        eth_hr = d.result[3].split(';');
        dcr_hr = d.result[5].split(';');
        temps = d.result[6].split(';');
        cgpu = [];
        for (j = 0; j < eth_hr.length; j++) {
            cgpu[j] ={
                "hash" : eth_hr[j],
                "hash2" : dcr_hr[j],
                "temps" : temps[j*2],
                "fan"   : temps[j*2+1],
                "power" : -1
            }        
        }
        if(eth[0]<1){
            lowhashcount++;
            cerror = null; 
            if(lowhashcount>5){
                cerror = "0 HASH";
            }  
            chash = 0;
            chash2 = 0; 
        }else{
            lowhashcount = 0;
            cerror = null;           
            chash = eth[0];
            chash2 = dcr[0]            
        };
        clay.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : Math.floor(Date.now() / 1000)-d.result[1]*60,
            "pools"      : d.result[7],
            "ver"        : d.result[0],
            "comments"   : c.comments,
            "offline"    : c.offline,
            "power"      : c.power,
            "error"      : cerror,
            "gpu"        : cgpu,
            "coin"       : c.coin,
            "algo"       : c.algo,
            "hash"       : chash,
            "hash2"      : chash2,
        };
    })

    .on('close', function() {
        setTimeout(poll, m.poll);
    })

    .on('error', function(e) {
        clay.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : "",
            "pools"      : "",
            "ver"        : "",
            "comments"   : c.comments,
            "offline"    : c.offline,
            "warning"    : null,
            "error"      : e.code,
            "power"      : "",
            "gpu"        : [],
            "last_seen"  : c.last_seen ? c.last_seen : 0
        };
    });

    function poll() {
        m.socket.connect(m.port, m.host);
    };

    if ((typeof c.offline === 'undefined') || !c.offline) {
        poll();
    } else {
        clay.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : "",
            "pools"      : "",
            "ver"        : "",
            "comments"   : c.comments,
            "offline"    : c.offline,
            "error"      : null,
            "power"      : "",
            "gpu"        : []
        };
    }
});

module.exports = {
    getData: function () {
        return clay.json;
    }
}
// --------------- /REQUESTER ---------------
