/**
 * 
 * November 21, 2019
 * @author Vincent Nguyen
 */

const DISCORD = require("discord.js");
const LOGGER_LEVEL = "debug";

const MISSING_SETTINGS = "Settings file is missing!";
const CONFIG_LOCATION = "./config/";

const DEFAULT_EMBED_FOOTER_MESSAGE = "This is an automated message.";
const DEFAULT_EMBED_FOOTER_IMAGE = "https://i.imgur.com/bZrkV3Y.jpg";
const DEFAULT_EMBED_DESCRIPTION_LENGTH = 750;
const DEFAULT_EMBED_LINK = "https://discord.gg/wWxCsEP";

"use strict";

const Bot = (function () {
    let instance; // The singleton instance of Bot. Only 1 may exist at a time.
    let isLocal = true;

    try {
        var settings = require(`${CONFIG_LOCATION}settings.json`);
    } catch (e) {
        console.error(`${MISSING_SETTINGS} ${e}`);
        isLocal = false;
    }

    function init() {
        this.mName = "Bot";
        this.mAvatarUrl = "https://cdn.discordapp.com/attachments/475077159094976516/650999293733371917/585205879.jpg";
        this.mPrefix = "!";

        if (isLocal) {
            this.mToken = settings.token;
            this.mID = settings.client_id;
            this.mSecret = settings.client_secret;
        } else {
            this.mToken = process.env.BOT_TOKEN;
            this.mID = process.env.CLIENT_ID;
            this.mSecret = process.env.CLIENT_SECRET;
        }

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

        this.mLogChannel = null;

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

        function formatEmbedDescription(description) {
            const finalDescription = ((description.length > DEFAULT_EMBED_DESCRIPTION_LENGTH) ? description.substr(0, DEFAULT_EMBED_DESCRIPTION_LENGTH - 1) +
                "..." : description);
            return finalDescription.replace(/<[^>]*>/g, "");
        }

        return {
            online: "online",
            away: "idle",
            busy: "dnd",
            invisible: "invisible",
            purple_hex: "#a504db",
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
            setLogChannel: function (newLogChannel) {
                return mLogChannel = newLogChannel;
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
            getLogChannel: function () {
                return mLogChannel;
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
            },
            createEmbedFromMessage: function (message,
                channel,
                title,
                author,
                author_thumbnail,
                thumbnail,
                url,
                description,
                footer,
                footer_image_url,
                embed_image,
                color,
                embed_fields_top,
                embed_fields_bottom) {
                const embed = new DISCORD.RichEmbed().setTimestamp();

                if (title)
                    embed.setTitle(title);

                if (author && author_thumbnail)
                    embed.setAuthor(author, author_thumbnail);
                else if (author)
                    embed.setAuthor(author, this.getAvatarURL());
                else
                    embed.setAuthor(this.getName(), this.getAvatarURL());

                embed.setThumbnail((thumbnail) ? thumbnail : message.guild.icon_url);
                embed.setURL((url)? url : DEFAULT_EMBED_LINK);

                if (description)
                    embed.setDescription(description);

                if (footer)
                    embed.setFooter(footer, footer_image_url);
                else if (!footer_image_url)
                    embed.setFooter(DEFAULT_EMBED_FOOTER_MESSAGE, footer_image_url);
                else
                    embed.setFooter(DEFAULT_EMBED_FOOTER_MESSAGE, DEFAULT_EMBED_FOOTER_IMAGE);

                if (embed_image)
                    embed.setImage(embed_image);

                if (color)
                    embed.setColor(color);
                else
                    embed.setColor(this.purple_hex);

                if (embed_fields_top && embed_fields_bottom) {
                    const fieldsLength = embed_fields_top.length;

                    if (fieldsLength != embed_fields_bottom.length)
                        this.error("Fields Top and Bottom lengths are unequal.");
                    else
                        for (let i = 0; i < fieldsLength; i++)
                            embed.addField(embed_fields_top[i], embed_fields_bottom[i], true);
                }

                if (channel)
                    channel.send(embed);
                else
                    message.channel.send(embed);

                this.info("Embed message sent.");
                return embed;
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