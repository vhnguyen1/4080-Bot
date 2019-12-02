/**
 * Contains all the available commands/functionality exclusive to developers and administrators.
 * Since most of these are very powerful commands, all other users will be blocked/prohibited from accessing
 * them.
 * 
 * December 01, 2019
 * @author Vincent Nguyen
 */

const CONFIG_LOCATION = "../config/";
const ROLE_PERMISSIONS = require(`${CONFIG_LOCATION}allowed_roles.json`);

const ENTER_VALID_STATUS = "Please enter a valid status.";
const ENTER_VALID_ACTIVITY = "Please enter a valid activity.";
const ENTER_VALID_IMAGE = "Please enter a valid image URL.";
const ENTER_MENTION = "Please **@mention** a valid user to ban."
const ENTER_VALID_MSG_AMOUNT = "Please enter a valid amount of messages to delete.";
const STATUS_CHANGED = "Status changed to ";
const NO_REASON_SPECIFIED = "No reason specified.";
const SPACE =  " ";

// Permission Locks
const GENERAL_ADMIN_ROLES = ROLE_PERMISSIONS.admin;

"use strict";

const COMMANDS = {
    "activity": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Changes the current game/activity that is seen under Bot.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                const activity = args.join(SPACE);

                if (activity) {
                    bot.warn(`${bot.getName()} activity changed to ${activity} by ${message.author.username}.`);
                    bot.setActivity(activity);
                } else
                    return message.reply(ENTER_VALID_ACTIVITY);
            }
        }
    },
    "avatar": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Changes Bot's current avatar to the specified image.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                if (args && bot.isValidLink(args[0])) {
                    bot.warn(`${message.author.username} has attempted to change " + ${bot.getName()}'s avatar to ${args[0]}.`);
                    bot.getClient().user.setAvatar(args[0]);
                } else
                    return message.reply(ENTER_VALID_IMAGE);
            }
        }
    },
    "ban": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Bans a specified user.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                const member = message.mentions.members.first();

                if (!member)
                    return message.reply(ENTER_MENTION);

                const reason = ((args.length > 1) ? bot.joinParameters(args.slice(1)) : NO_REASON_SPECIFIED);
                member.ban(reason).catch(e => message.reply(`Unable to ban ${message.author}: ${e}`));
                member.send("You've been banned!").catch(e => bot.error(`Unable to inform ${message.author} of ban: ${e}`));
            }
        }
    },
    "emit": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Simulates a Bot Client event occurrance such as onMessage. Mainly for testing purposes.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                const client = bot.getClient();

                switch (bot.joinParameters(args)) {
                    case "add":
                    case "join":
                        client.emit("guildMemberAdd", message.member);
                        break;
                    case "ban":
                    case "boot":
                    case "kick":
                        client.emit("guildMemberRemove", message.member);
                        break;
                    case "ready":
                    case "start":
                        client.emit("ready");
                        break;
                    default:
                        message.reply("Please enter a valid event to simulate.");
                }
            }
        }
    },
    "kick": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Kicks a specified user.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                const member = message.mentions.members.first();

                if (!Boolean(member))
                    return message.reply("Please **@mention** a valid user to kick.");

                const reason = ((args.length > 1) ? bot.joinParameters(args.slice(1)) : "No reason specified.");
                member.kick(reason).catch(e => message.reply(`Unable to kick ${member.name}: ${e}`));
            }
        }
    },
    "logout": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Exits the command window and logs Bot off.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                bot.setStatus(bot.invisible);
                message.reply("Logging off.");
                bot.logout();
            }
        }
    },
    "name": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Changes the current username to the specified one.",
        execute: function (bot, message, args) {
            if (bot.hasPermission(message, this.permissions)) {
                const username = bot.joinParameters(args);

                if (!username || username.equalsIgnoreCase(bot.getName()))
                    return message.reply("Please enter a valid username.");

                bot.getClient().user.setUsername(username).catch(e => message.reply(`Unable to change Bot name to ${username}: ${e}`));
                bot.setName(username);
                bot.warn(message.author.username + " has attempted to change " + bot.getName() + "'s username to " + username + ".");
            }
        }
    },
    "delete": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Clears a user-specified amount of the most recent messages sent in a text channel.",
        execute: function (bot, message, args) {
            if (!bot.hasPermission(message, this.permissions))
                return;
            else if (!args|| isNaN(args[0]))
                return message.reply("The delete command may only take in numberical values.");

            let amount = parseInt(args[0]);
            if (amount < 1)
                return message.reply(ENTER_VALID_MSG_AMOUNT);
            else if (amount === 1)
                amount = 2;

            bot.warn(`${amount} messages have been deleted by ${message.author.username}.`);
            message.channel.fetchMessages({
                limit: amount
            }).then(messages => message.channel.bulkDelete(messages))
                .catch(e => message.channel.send(`Error deleting ${amount} messages: ${e}`));
        }
    },
    "status": {
        permissions: GENERAL_ADMIN_ROLES,
        description: "Changes Bot's current status.",
        execute: function (bot, message, args) {
            if (!bot.hasPermission(message, this.permissions))
                return;
            else if (!args)
                return message.reply(ENTER_VALID_STATUS);

            switch (args[0]) {
                case "on":
                case "green":
                case bot.online:
                    bot.setStatus(bot.online);
                    bot.warn(STATUS_CHANGED + bot.online);
                    break;
                case "black":
                case "off":
                case "offline":
                case bot.invisible:
                    bot.setStatus(bot.invisible);
                    bot.warn(STATUS_CHANGED + bot.invisible);
                    break;
                case "busy":
                case "maintenance":
                case "red":
                case bot.busy:
                    bot.setStatus(bot.busy);
                    bot.warn(STATUS_CHANGED + bot.busy);
                    break;
                case "away":
                case "afk":
                case "orange":
                case bot.away:
                    bot.setStatus(bot.away);
                    bot.warn(STATUS_CHANGED + bot.away);
                    break;
                default:
                    message.reply(ENTER_VALID_STATUS);
            }
        }
    }
};

exports.commands = COMMANDS;