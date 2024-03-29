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
const GENERAL = require(`${DEFAULT_COMMAND_PATH}General.js`);

const BOT = require("./Bot.js").getInstance();
const CLIENT = BOT.getClient();

const RECENT_USERS = new Set(); // For command cooldowns.
const COMMAND_COOLDOWN = 1000; //  One second cooldown
const COMMAND_COOLDOWN_ERROR_MESSAGE = `You have recently used a command, please try again later (cooldown per command is: 
    ${(COMMAND_COOLDOWN / 1000)} seconds).`;

const HEROKU_FAILED = "Heroku login failed!";
const ATTEMPTING_LOCAL_LOGIN = "Attempting local login...\n";
const LOCAL_FAILED = "Local login failed!"

"use strict";

CLIENT.login(process.env.BOT_TOKEN).catch(e => {
    BOT.error(`${HEROKU_FAILED} - ${e}`);
    BOT.info(ATTEMPTING_LOCAL_LOGIN)
    CLIENT.login(BOT.getToken()).catch(e => BOT.error(`${LOCAL_FAILED} ${e}`));
});

CLIENT.on("message", async (message) => {
    try {
        const authorID = message.author.id;
        const messageContents = message.content;

        if (!messageContents.startsWith(BOT.getPrefix()))
            return;
        if (isBotMessage(message))
            return;

        message.channel.startTyping();
        message.channel.stopTyping();

        if (RECENT_USERS.has(authorID))
            return message.reply(COMMAND_COOLDOWN_ERROR_MESSAGE);

        RECENT_USERS.add(authorID);
        setTimeout(() => {
            RECENT_USERS.delete(authorID);
        }, COMMAND_COOLDOWN);

        const args = messageContents.slice(BOT.getPrefix().length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (ADMIN.commands.hasOwnProperty(command))
            ADMIN.commands[command].execute(BOT, message, args);
        else if (GENERAL.commands.hasOwnProperty(command))
            GENERAL.commands[command].execute(BOT, message, args);
    } catch (e) {
        console.trace();
        BOT.error(e);
    } finally {
        logChat(message);
    }

});

CLIENT.on("guildMemberAdd", async (member) => {
    BOT.warn(`${member.user.username} just joined ${member.guild.name}!`);
    BOT.pm(member, `Welcome to ${member.guild.name}!`);
});

CLIENT.on("guildMemberRemove", async (member) => {
    BOT.warn(`${member.user.username} has been booted from ${member.guild.name}!`);
    BOT.pm(member, `You have left **${member.guild.name}**!`);
});

CLIENT.on("ready", () => {
    BOT.log("Starting up...");
    BOT.setActivity("with Node.js!");
    BOT.setLogChannel(CLIENT.channels.get("651286630497517581"));
    BOT.log("Ready to go!\n");
});

CLIENT.on("voiceStateUpdate", async (oldState, newState) => {
    let voiceStateText;
    var isValidStateUpdate = false;

    if (!oldState.voiceChannel) {
        isValidStateUpdate = true;
        voiceStateText = `<@${oldState.user.id}> joined ${newState.voiceChannel.name}`;
    } else if (oldState.voiceChannel != newState.voiceChannel) {
        isValidStateUpdate = true;
        voiceStateText = `<@${oldState.user.id}> left ${oldState.voiceChannel.name}`;

        if (newState.voiceChannel)
            voiceStateText += ` and joined ${newState.voiceChannel.name}`
    } else if (oldState.selfMute != newState.selfMute) {
        isValidStateUpdate = true;
        voiceStateText = `<@${newState.user.id}> is ${((newState.selfMute) ? " was muted in " : " was unmuted in")} ${newState.voiceChannel.name}`;
    }

    if (isValidStateUpdate) {
        BOT.createEmbedFromMessage(oldState,
            BOT.getLogChannel(),
            null,
            `Voice State Updated: ${oldState.user.id}`,
            null,
            null,
            null,
            voiceStateText,
            null,
            null,
            null,
            null,
            null);
    }
});

CLIENT.on("messageDelete", async (message) => {
    if (isBotMessage(message))
        return;

    console.log(`Message: "${message.cleanContent}" was deleted from channel: ${message.channel.name} at ${new Date()}`);

    BOT.createEmbedFromMessage(message,
        BOT.getLogChannel(),
        `Message Deleted: ${message.id}`,
        `${message.member.user.tag}`,
        message.author.avatarURL,
        null,
        null,
        `<@${message.author.id}>'s message from <#${message.channel.id}> was deleted:\n${message.cleanContent}`,
        null,
        message.author.avatarURL,
        null,
        null,
        null,
        null);
});

CLIENT.on('messageUpdate', async (oldMessage, newMessage) => {
    if (isBotMessage(oldMessage))
        return;

    BOT.createEmbedFromMessage(oldMessage,
        BOT.getLogChannel(),
        `Message Edited: ${oldMessage.id}`,
        `${oldMessage.member.user.tag}`,
        oldMessage.author.avatarURL,
        null,
        null,
        `<@${oldMessage.author.id}>'s message in <#${oldMessage.channel.id}> was changed **\n\nFrom:**\n${oldMessage.cleanContent}\n\n**To:**\n${newMessage.content}`,
        null,
        oldMessage.author.avatarURL,
        null,
        null,
        null,
        null);
});

CLIENT.on('guildMemberUpdate', async (member, updatedMember) => {
    const oldRoles = member.roles.array();
    const newRoles = updatedMember.roles.array();

    let roleText = `<@${member.user.id}>`;
    let roles;

    if (oldRoles.length < newRoles.length) {
        roles = newRoles.filter(r => !oldRoles.includes(r));
        roleText += ` was given the ${roles.toString()} role.`;
    } else {
        roles = oldRoles.filter(r => !newRoles.includes(r));
        roleText += `'s ${roles.toString()} role was removed.`;
    }

    BOT.createEmbedFromMessage(member,
        BOT.getLogChannel(),
        `User Role Updated: ${member.user.id}`,
        `${member.user.tag}`,
        member.user.avatarURL,
        null,
        null,
        roleText,
        null,
        member.user.avatarURL,
        null,
        null,
        null,
        null);
});

CLIENT.on("roleCreate", function (role) {
    BOT.createEmbedFromMessage(role,
        BOT.getLogChannel(),
        `Role List Updated: ${role.id}`,
        `New Role Created`,
        null,
        null,
        null,
        `New Role Created: ${role}`,
        null,
        null,
        null,
        null,
        null);
});

CLIENT.on("roleDelete", function (role) {
    BOT.createEmbedFromMessage(role,
        BOT.getLogChannel(),
        `Role List Updated: ${role.id}`,
        `Role Deleted: ${role.name}`,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null);
});

function logChat(message) {
    BOT.log(`${BOT.getExactMoment(new Date())} → ${message.author.username}: ${message.content}`);
}

function isBotMessage(message) {
    return message.author.bot;
}