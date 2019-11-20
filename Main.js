/**
 * 
 * 
 * November 21, 2019
 * @author Vincent Nguyen
 */

// Assets
const ASSETS_LOCATION = "./assets/";

const BOT = require("./Bot.js").getInstance();
const CLIENT = BOT.getClient();

const RECENT_USERS = new Set(); // For command cooldowns.
const COMMAND_COOLDOWN = 2000;
const COMMAND_COOLDOWN_ERROR_MESSAGE = "You have recently used a command, please try again later (cooldown per command is: " +
    (COMMAND_COOLDOWN / 1000) + " seconds).";

"use strict";

CLIENT.login("NjQ2Nzg4Nzc3MDE2MDMzMzIx.XdWrlg.29yLi3qVKFmwsxlIrlN_OsJp1rA").catch(e => {
    BOT.error(e);
});

CLIENT.on("any", function (event) {});

CLIENT.on("disconnect", (event) => {});

CLIENT.on("debug", (bug) => {});

CLIENT.on("error", (e) => {});

CLIENT.on("guildCreate", (guild) => {});

CLIENT.on("guildMemberAdd", (member) => {});

CLIENT.on("guildMemberRemove", (member) => {});

CLIENT.on("message", message => {
    const authorID = message.author.id;
    const messageContents = message.content;
    BOT.log(messageContents);

    if (!messageContents.startsWith("!"))
        return;
    
    message.channel.startTyping();
    message.channel.stopTyping();

    if (RECENT_USERS.has(authorID))
        return message.reply(COMMAND_COOLDOWN_ERROR_MESSAGE);

    RECENT_USERS.add(authorID);
    setTimeout(() => {
        RECENT_USERS.delete(authorID);
    }, COMMAND_COOLDOWN);
});

CLIENT.on("ready", () => {
    BOT.log("Starting up...");
    BOT.setActivity("with Node.js!");
    BOT.log("Ready to go!\n");
});

CLIENT.on("voiceStateUpdate", (oldMember, newMember) => {

});

CLIENT.on("warn", (notice) => {});

process.on("uncaughtException", function (e) {

});

process.on("unhandledRejection", (reason) => {

});