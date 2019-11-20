/**
 * 
 * November 21, 2019
 * @author Vincent Nguyen
 */

const DISCORD = require("discord.js");
const LOGGER_LEVEL = "debug";

"use strict";

const Bot = (function () {
    let instance; // The singleton instance of Bot. Only 1 may exist at a time.

    function init() {
        this.mID = 646788777016033321;
        this.mSecret = "xJUZ5frcvsEdGE2rquM6ynVjQzKYIXt0";

        this.mPrefix = "!";
        this.mToken = "NjQ2Nzg4Nzc3MDE2MDMzMzIx.XdWPqg.wNwfI9683vQtbbSoCa6ofWIpaFQ";

        this.mClient = new DISCORD.Client({
            autoReconnect: true,
            disabledEvents: [],
            max_message_cache: 0
        });

        this.mLogger = require("winston");
        this.mLogger.level = LOGGER_LEVEL;
        this.mLogger.remove(this.mLogger.transports.Console);
        this.mLogger.add(this.mLogger.transports.Console, {
            colorize: true
        });

        return {
            debug: function (message) {
                mLogger.debug(message);
            },
            error: function (message) {
                mLogger.error(message);
            },
            log: function (message) {
                mLogger.info(message);
            },
            warn: function (message) {
                mLogger.warn(message);
            },
            logout: function () {
                process.exit(0);
            },
            getClient: function () {
                return mClient;
            },
            setActivity: function (activity) {
                this.warn("Activity changed!");
                mClient.user.setActivity(activity);
            }
        };
    };

    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
                instance.constructor = null;
                Object.seal(instance);

                console.log("Node version: " + process.version);
                console.log("Discord.js version: " + DISCORD.version + "\n");
            }

            return instance;
        }
    };
})();

module.exports = Bot;