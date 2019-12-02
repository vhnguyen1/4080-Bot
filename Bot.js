/**
 * 
 * November 21, 2019
 * @author Vincent Nguyen
 */

const DISCORD = require("discord.js");
const LOGGER_LEVEL = "debug";

const CONFIG_LOCATION = "./config/";
const SETTINGS = require(`${CONFIG_LOCATION}settings.json`);

"use strict";

const Bot = (function () {
    let instance; // The singleton instance of Bot. Only 1 may exist at a time.

    function init() {
        this.mName = SETTINGS.name;
        this.mAvatarUrl = SETTINGS.avatar_url;
        this.mPrefix = SETTINGS.prefix;
        this.mToken = SETTINGS.token;
        this.mID = SETTINGS.client_id;
        this.mSecret = SETTINGS.client_secret;

        this.mClient = new DISCORD.Client({
            autoReconnect: true,
            disabledEvents: [],
            max_message_cache: 0
        });

        this.mURLValidater = require("valid-url");
        this.mLogger = require("winston");
        this.mLogger.level = LOGGER_LEVEL;
        this.mLogger.remove(this.mLogger.transports.Console);
        this.mLogger.add(this.mLogger.transports.Console, {
            colorize: true
        });

        // Private helper method
        function addLeadingZero(number) {
            let numberString = number.toString();

            if (numberString.length == 1)
                numberString = "0" + numberString;

            return numberString;
        }

        function convertHours(hours) {
            const convertedHours = ((hours + 11) % 12 + 1);
            return addLeadingZero(convertedHours.toString());
        }

        function getHourSuffix(hours) {
            return ((hours >= 12) ? "pm" : "am");
        }

        function clearWhiteSpace(str) {
            return str.replace(/\s/g, '');
        }

        return {
            online: "online",
            away: "idle",
            busy: "dnd",
            invisible: "invisible",
            debug: function (message) {
                mLogger.debug(message).catch(e => message.channel.send(`${e}.`));
            },
            error: function (message) {
                mLogger.error(message);
            },
            info: function (message) {
                mLogger.info(message);
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
            pm: function (member, message) {
                member.send(message).catch(e => this.error(e));
            },
            isValidLink: function (url) {
                return mURLValidater.isUri(url);
            },
            hasPermission: function (message, permissions) {
                const userPermissions = message.member.roles.some(role => permissions.includes(role.name));

                if (!userPermissions) {
                    message.reply(NOT_ENOUGH_PERMISSION);
                    return false
                } else
                    return true;
            },
            joinParameters: function (strArray) {
                return strArray.join(" ");
            },
            setActivity: function (activity) {
                this.warn("Activity changed!");
                mClient.user.setActivity(activity);
            },
            setName: function (newName) {
                mName = newName;
            },
            setStatus: function (status) {
                mClient.user.setStatus(status);
            },
            getClient: function () {
                return mClient;
            },
            getAvatarURL: function () {
                return mAvatarUrl;
            },
            getName: function () {
                return mName;
            },
            getPrefix: function () {
                return mPrefix;
            },
            getToken: function () {
                return mToken;
            },
            getCurrentDate: function (currentDate) {
                const date = [addLeadingZero((currentDate.getMonth() + 1))];
                date.push("-");
                date.push(addLeadingZero(currentDate.getDate()));
                date.push("-");
                date.push(currentDate.getFullYear());
                return clearWhiteSpace(this.joinParameters(date));
            },
            getCurrentTime: function (currentDate) {
                const hours = currentDate.getHours();
                const convertedHours = convertHours(hours);
                const hoursSuffix = getHourSuffix(hours);

                const date = [convertedHours];
                date.push(":");
                date.push(addLeadingZero(currentDate.getMinutes()));
                date.push(":");
                date.push(addLeadingZero(currentDate.getSeconds()));
                date.push(hoursSuffix);
                //date.push(" PST");
                return clearWhiteSpace(this.joinParameters(date));
            },
            getExactMoment: function (currentDate) {
                return `${this.getCurrentDate(currentDate)} [${this.getCurrentTime(currentDate)}]`;
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