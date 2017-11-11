module.exports = (function() {
    'use strict';

    // Module dependencies
    var crypto  = require('crypto'),
        request = require('request'),
        nonce   = require('nonce')();

    // Constants
    var version         = '0.0.8',
        PUBLIC_API_URL  = 'https://poloniex.com/public',
        PRIVATE_API_URL = 'https://poloniex.com/tradingApi',
        USER_AGENT      = 'poloniex.js ' + version;
        //USER_AGENT    = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0'

    // Helper methods
    function joinCurrencies(currencyA, currencyB) {
        // If only one arg, then return the first
        if (typeof currencyB !== 'string') {
            return currencyA;
        }

        return currencyA + '_' + currencyB;
    }

    // Constructor
    function Poloniex(key, secret) {
        // Generate headers signed by this user's key and secret.
        // The secret is encapsulated and never exposed
        this._getPrivateHeaders = function(parameters) {
            var paramString, signature;

            if (!key || !secret) {
                throw 'Poloniex: Error. API key and secret required';
            }

            // Convert to `arg1=foo&arg2=bar`
            paramString = Object.keys(parameters).map(function(param) {
                return encodeURIComponent(param) + '=' + encodeURIComponent(parameters[param]);
            }).join('&');

            signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');

            return {
                Key: key,
                Sign: signature
            };
        };
    }

    // Currently, this fails with `Error: CERT_UNTRUSTED`
    // Poloniex.STRICT_SSL can be set to `false` to avoid this. Use with caution.
    // Will be removed in future, once this is resolved.
    Poloniex.STRICT_SSL = true;

    // Customisable user agent string
    Poloniex.USER_AGENT = USER_AGENT;

    // Prototype
    Poloniex.prototype = {
        constructor: Poloniex,

        // Make an API request
        _request: function(options, callback) {
            if (!('headers' in options)) {
                options.headers = {};
            }

            options.json = true;
            options.headers['User-Agent'] = Poloniex.USER_AGENT;
            options.strictSSL = Poloniex.STRICT_SSL;

            request(options, function(err, response, body) {
		    // Empty response
		    if (!err && (typeof body === 'undefined' || body === null)){
			err = 'Empty response';
		    }

		    callback(err, body);
		});

            return this;
        },

        // Make a public API request
        _public: function(command, parameters, callback) {
            var options;

            if (typeof parameters === 'function') {
                callback = parameters;
                parameters = {};
            }

            parameters || (parameters = {});
            parameters.command = command;
            options = {
                method: 'GET',
                url: PUBLIC_API_URL,
                qs: parameters
            };

            options.qs.command = command;
            return this._request(options, callback);
        },

        // Make a private API request
        _private: function(command, parameters, callback) {
            var options;

            if (typeof parameters === 'function') {
                callback = parameters;
                parameters = {};
            }

            parameters || (parameters = {});
            parameters.command = command;
            parameters.nonce = nonce();

            options = {
                method: 'POST',
                url: PRIVATE_API_URL,
                form: parameters,
                headers: this._getPrivateHeaders(parameters)
            };

            return this._request(options, callback);
        },

        /////
        // PUBLIC METHODS

        returnTicker: function(callback) {
            return this._public('returnTicker', callback);
        },

        return24hVolume: function(callback) {
            return this._public('return24hVolume', callback);
        },

        returnOrderBook: function(currencyA, currencyB, callback) {
            var parameters = {
		currencyPair: joinCurrencies(currencyA, currencyB)
	    };

            return this._public('returnOrderBook', parameters, callback);
        },

        returnChartData: function(currencyA, currencyB, period, start, end, callback) {
            var parameters = {
                currencyPair: joinCurrencies(currencyA, currencyB),
		period: period,
		start: start,
		end: end
            };

            return this._public('returnChartData', parameters, callback);
        },

        returnCurrencies: function(callback) {
            return this._public('returnCurrencies', callback);
        },

        returnLoanOrders: function(currency, callback) {
            return this._public('returnLoanOrders', {currency: currency}, callback);
        },

        /////
        // PRIVATE METHODS

        returnBalances: function(callback) {
            return this._private('returnBalances', {}, callback);
        },

	returnCompleteBalances: function(callback) {
            return this._private('returnCompleteBalances', {}, callback);
        },

        returnDepositAddresses: function(callback) {
            return this._private('returnDepositAddresses', {}, callback);
        },

        generateNewAddress: function(currency, callback) {
            return this._private('returnDepositsWithdrawals', {currency: currency}, callback);
        },

        returnDepositsWithdrawals: function(start, end, callback) {
            return this._private('returnDepositsWithdrawals', {start: start, end: end}, callback);
        },

        returnOpenOrders: function(currencyA, currencyB, callback) {
            var parameters = {
		currencyPair: joinCurrencies(currencyA, currencyB)
	    };

            return this._private('returnOpenOrders', parameters, callback);
        },

        returnTradeHistory: function(currencyA, currencyB, callback) {
            var parameters = {
		currencyPair: joinCurrencies(currencyA, currencyB)
	    };

            return this._private('returnTradeHistory', parameters, callback);
        },

        returnOrderTrades: function(orderNumber, callback) {
            var parameters = {
		orderNumber: orderNumber
	    };

            return this._private('returnOrderTrades', parameters, callback);
        }

    };

    // Backwards Compatibility
    Poloniex.prototype.getTicker = Poloniex.prototype.returnTicker;
    Poloniex.prototype.get24hVolume = Poloniex.prototype.return24hVolume;
    Poloniex.prototype.getOrderBook = Poloniex.prototype.returnOrderBook;
    Poloniex.prototype.getTradeHistory = Poloniex.prototype.returnChartData;
    Poloniex.prototype.myBalances = Poloniex.prototype.returnBalances;
    Poloniex.prototype.myOpenOrders = Poloniex.prototype.returnOpenOrders;
    Poloniex.prototype.myTradeHistory = Poloniex.prototype.returnTradeHistory;

    return Poloniex;
})();