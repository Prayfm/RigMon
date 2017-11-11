var config = require('./config.json');
var net = require('net');

var ewbf = [];
ewbf.json = [];

function checkJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return true;
        }
    }
    catch (e) { }

    return false;
};


config.ewbf.forEach(function(item, i, arr) {

    // settings
    var nvm = ewbf[i] = {};
    var c = config.ewbf[i];
    var j = ewbf.json[i];

    nvm.name = c.name;
    nvm.host = c.host;
    nvm.port = c.port;
    nvm.poll = (typeof c.poll !== 'undefined') ? c.poll : config.miner_poll;
    nvm.timeout = (typeof c.timeout !== 'undefined') ? c.timeout : config.miner_timeout;

    function hostname() {
        return c.hostname ? c.hostname : (nvm.host + ':' + nvm.port);
    }

    // stats
    nvm.reqCnt = 0;
    nvm.rspCnt = 0;

    // it was never seen and never found good yet
    c.last_seen = null;
    c.last_good = null;

    // socket
    nvm.socket = new net.Socket()

    .on('connect', function() {
        var req = '{"id":0, "method":"getstat"}';
        ++nvm.reqCnt;
        nvm.socket.write(req + '\n');
        nvm.socket.setTimeout(nvm.timeout);
    })

    .on('timeout', function() {
        nvm.socket.destroy();
        ewbf.json[i] = {
            "name"       : nvm.name,
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
        ++nvm.rspCnt;
        c.last_seen = Math.floor(Date.now() / 1000);
        nvm.socket.setTimeout(0);
        if(checkJSON(data)){
            nvd = JSON.parse(data);
            ntotal = 0;
            ngpu = [];
            for (j in nvd.result) {
                ntotal = ntotal + nvd.result[j].speed_sps;
                ngpu[j] ={
                    "hash" : nvd.result[j].speed_sps,
                    "hash2" : -1,
                    "temps" : nvd.result[j].temperature,
                    "fan"   : -1,
                    "power" : nvd.result[j].gpu_power_usage
                }
            }
            nerror = null;
            if(ntotal<1){
                nerror = "0 HASH";
            }
            ewbf.json[i] = {
                "name"       : nvm.name,
                "host"       : hostname(),
                "uptime"     : nvd.start_time,
                "pools"      : nvd.current_server,
                "ver"        : "EWB",
                "comments"   : c.comments,
                "offline"    : c.offline,
                "power"      : c.power,
                "error"      : nerror,
                "gpu"        : ngpu,
                "coin"       : c.coin,
                "algo"       : c.algo,
                "hash"       : ntotal
            };
        }else{
            console.log("bad JSON");
            return
        }        
    })

    .on('close', function() {
        setTimeout(poll, nvm.poll);
    })

    .on('error', function(e) {
        ewbf.json[i] = {
            "name"       : nvm.name,
            "host"       : hostname(),
            "uptime"     : "",
            "pools"      : "",
            "ver"        : "EWB",
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
        nvm.socket.connect(nvm.port, nvm.host);
    };

    if ((typeof c.offline === 'undefined') || !c.offline) {
        poll();
    } else {
        ewbf.json[i] = {
            "name"       : nvm.name,
            "host"       : hostname(),
            "uptime"     : "",
            "pools"      : "",
            "ver"        : "EWB",
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
        return ewbf.json;
    }
}
// --------------- /REQUESTER ---------------