/**
 * 
 * 
 * November 21, 2019
 * @author Vincent Nguyen
 */

const ASSETS_LOCATION = "./assets/";

// Commands
const DEFAULT_COMMAND_PATH = "./commands/";
const ADMIN = require(`${DEFAULT_COMMAND_PATH}Admin.js`);

const BOT = require("./Bot.js").getInstance();
const CLIENT = BOT.getClient();

const RECENT_USERS = new Set(); // For command cooldowns.
const COMMAND_COOLDOWN = 1000; //  One second cooldown
const COMMAND_COOLDOWN_ERROR_MESSAGE = "You have recently used a command, please try again later (cooldown per command is: " +
    (COMMAND_COOLDOWN / 1000) + " seconds).";

const HEROKU_FAILED = "Heroku login failed!";
const ATTEMPTING_LOCAL_LOGIN = "Attempting local login...\n";

"use strict";

CLIENT.login(process.env.BOT_TOKEN).catch(e => {
    BOT.error(`${HEROKU_FAILED} - ${e}`);
    BOT.info(ATTEMPTING_LOCAL_LOGIN)
    CLIENT.login(BOT.getToken()).catch(e => BOT.error(`Local login failed! ${e}`));
});

CLIENT.on("any", function (event) {
    BOT.info(`Event occurred: ${event} (${BOT.getExactMoment(new Date())})`);
});

CLIENT.on("disconnect", (event) => { });

CLIENT.on("debug", (bug) => { });

CLIENT.on("error", (e) => { });

CLIENT.on("guildCreate", (guild) => { });

CLIENT.on("guildMemberAdd", (member) => {
    BOT.warn(`${member.user.username} just joined ${member.guild.name}!`);
    member.send(`Welcome to ${member.guild.name}!`)
});

CLIENT.on("guildMemberRemove", (member) => {
    BOT.warn(`${member.user.username} has been booted from ${member.guild.name}!`);
    member.send(`You have left **${member.guild.name}**!`);
});

CLIENT.on("message", async (message) => {
    try {
        const authorID = message.author.id;
        const messageContents = message.content;

        if (!messageContents.startsWith(BOT.getPrefix()))
            return;
        if (isBot(oldMessage))
            return;

        message.channel.startTyping();
        message.channel.stopTyping();

        if (RECENT_USERS.has(authorID))
            return message.reply(COMMAND_COOLDOWN_ERROR_MESSAGE);

        RECENT_USERS.add(authorID);
        setTimeout(() => {
            RECENT_USERS.delete(authorID);
        }, COMMAND_COOLDOWN);

        //messageContents
        const args = messageContents.slice(BOT.getPrefix().length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (ADMIN.commands.hasOwnProperty(command))
            ADMIN.commands[command].execute(BOT, message, args);
    } catch (e) {
        console.trace();
        B2.error(e);
    } finally {
        logChat(message);
    }

});

CLIENT.on("ready", () => {
    BOT.log("Starting up...");
    BOT.setActivity("with Node.js!");
    BOT.setLogChannel(CLIENT.channels.get("651286630497517581"));
    BOT.log("Ready to go!\n");
});

CLIENT.on("voiceStateUpdate", (oldMember, newMember) => {

});

CLIENT.on("warn", (notice) => {
    BOT.warn(notice);
});

function logChat(message) {
    BOT.log(`${BOT.getExactMoment(new Date())} → ${message.author.username}: ${message.content}`);
}

function isBot(message) {
    return message.author.bot;
}

CLIENT.on('messageDelete', async (message) => {
    if (isBot(message))
        return;

    console.log(`Message: "${message.cleanContent}" was deleted from channel: ${message.channel.name} at ${new Date()}`);

    BOT.createEmbedFromMessage(message,
        BOT.getLogChannel(),
        `Message Deleted: ${message.id}`,
        `${message.member.user.tag}`,
        message.author.avatarURL,
        null,
        "https://discordapp.com/",
        `<@${message.author.id}>'s message from <#${message.channel.id}> was deleted:\n${message.cleanContent}`,
        null,
        message.author.avatarURL,
        null,
        null,
        null,
        null);
});

CLIENT.on('messageUpdate', async (oldMessage, newMessage) => {
    if (isBot(oldMessage))
        return;

    BOT.createEmbedFromMessage(oldMessage,
        BOT.getLogChannel(),
        `Message Edited: ${oldMessage.id}`,
        `${oldMessage.member.user.tag}`,
        oldMessage.author.avatarURL,
        null,
        "https://discordapp.com/",
        `<@${oldMessage.author.id}>'s message in <#${oldMessage.channel.id}> was changed **\n\nFrom:**\n${oldMessage.cleanContent}\n\n**To:**\n${newMessage.content}`,
        null,
        oldMessage.author.avatarURL,
        null,
        null,
        null,
        null);
});

CLIENT.on('memberRoleUpdate', async (member) => {
    
});