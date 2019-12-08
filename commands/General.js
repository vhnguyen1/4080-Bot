const STRAWPOLL = require("@mickaelftw/strawpolljs");
const WEATHER = require('weather-js');
const URBAN_DICTIONARY = require("superagent");

// Strawpoll
const STRAWPOLL_NAME = "Strawpoll";
const STRAWPOLL_ICON_URL = "https://i.imgur.com/Av7qgFY.jpg";
const STRAWPOLL_PREFIX = "http://www.strawpoll.me/";
const POLL_CATEGORY_SPLIT = "|";
const POLL_CHOICES_SPLIT = ",";
const POLL_PARAMETER_ERROR = "Please ensure that you separate the title with a '|' and each choice selection with a comma.";
const POLL_MINIMUM = 3;
const CAPTCHA = "**Captcha: **";
const MULTI = "**Multiple Selections: **";
const IP_CHECK = "**IP Checking Enabled: **";
const YES = "Yes";
const NO = "No";
const OPTION = "Option ";
const VOTES = "Votes: ";
const DEFAULT_DESCRIPTION = "Here's some information about ";

// Weather
const DEFAULT_WEATHER_ICON = "https://i.imgur.com/eqNHDij.png";
const DEFAULT_WEATHER_LINK = "https://www.msn.com/en-us/weather";
const DEFAULT_WEATHER_LOCATION = "Pomona";
const DEFAULT_WEATHER_UNIT = "F";

// Urban Dictionary
const URBAN_DICTIONARY_API_LINK = "http://api.urbandictionary.com/v0/define";
const URBAN_DICTIONARY_UNSUCCESSFUL = "no_results";
const URBAN_DICTIONARY_ICON = "https://i.imgur.com/1uavPhx.jpg";

const SEARCH_SUCCESS_CODE = 200;
const DEFAULT_NO_RESPONSE = "No response from the server. Please make sure you're searching something valid!";

const COMMANDS = {
    "ping": {
        permissions: [],
        description: "Displays the current ping.",
        execute: function (bot, message, args) {
            bot.ping(message);
        }
    },
    "poll": {
        permissions: [],
        description: "Creates a user-specified strawpoll.",
        execute: function (bot, message, args) {
            const pollText = bot.joinParameters(args);
            if (args.length < POLL_MINIMUM || !hasValidPollParameters(pollText))
                return message.reply(POLL_PARAMETER_ERROR);

            const userPoll = intializePoll(bot, pollText, false, false);
            userPoll.createPoll().then((poll) => {
                getPollInfo(bot, message, userPoll, true);
                poll.getVotes()
                    .then((poll) => {
                        //bot.info("New strawpoll - " + poll.title + " has been created by " + message.author.username + ".");
                    });
            }).catch(e => message.channel.send(`${e}. `));
        }
    },
    "weather": {
        permissions: [],
        description: "Gets the weather report of a specified city/area/country.",
        execute: function (bot, message, args) {
            const searchParameters = ((args && args.length !== 0) ? bot.joinParameters(args) : DEFAULT_WEATHER_LOCATION);

            WEATHER.find({
                search: searchParameters,
                degreeType: DEFAULT_WEATHER_UNIT
            }, function (e, result) {
                if (e) {
                    bot.error(e);
                    return message.reply(DEFAULT_API_ERROR_MESSAGE);
                }

                const current = result[0].current;
                if (!current)
                    return message.reply(DEFAULT_NO_RESPONSE);

                const location = result[0].location;
                const temperature = parseInt(current.temperature);
                const skyConditions = current.skytext;
                const skyText = bot.joinParameters([
                    "     ",
                    ((skyConditions.toLowerCase().endsWith("rain")) ? " Be sure to bring an umbrella along with you!" :
                        (skyConditions.toLowerCase().endsWith("fog")) ? " Drive carefully!" :
                            (skyConditions.toLowerCase().endsWith("hail")) ? " Watch out for hail!" :
                                (temperature > 83) ? " It's going to be relatively hot today!" :
                                    (temperature < 71) ? " Be sure to bring a sweater along with you!" :
                                        " It's a relatively nice day today!"),
                    "\n",
                    " Weather report information brought to you by of [**__MSN__**](https://www.msn.com/en-us/weather) ",
                    "\n**----------------------------------------------------------------**"
                ]);

                const channel = message.channel;
                const fieldsTop = [
                    "❯❯\u2000\Temperature",
                    "❯❯\u2000\Feels Like",
                    "❯❯\u2000\Timezone",
                    "❯❯\u2000\Degree Type",
                    "❯❯\u2000\Winds",
                    "❯❯\u2000\Humidity",
                    "---------------------- Side Note ------------------------------",
                ];
                const fieldsBottom = [
                    bot.joinParameters([current.temperature, "°"]),
                    bot.joinParameters([current.feelslike, "°"]),
                    bot.joinParameters(["UTC", location.timezone]),
                    bot.joinParameters(["°", location.degreetype]),
                    current.winddisplay,
                    bot.joinParameters([current.humidity, "%"]),
                    skyText
                ];

                bot.createEmbedFromMessage(message,
                    channel,
                    bot.joinParameters(["Weather Report →", current.observationpoint]),
                    "MSN Weather",
                    DEFAULT_WEATHER_ICON,
                    current.imageUrl,
                    DEFAULT_WEATHER_LINK,
                    bot.joinParameters([DEFAULT_WEATHER_LINK, "\n", "\n", "**Today's Forecast: __", current.skytext, "__ (", temperature, "°)**"]),
                    bot.joinParameters(["Weather search conducted by ", message.author.username]),
                    message.author.avatarURL,
                    null,
                    null,
                    fieldsTop,
                    fieldsBottom);
            });
        }
    },
    "ud": {
        permissions: [],
        description: "Gets the definition of a user-specified term from Urban Dictionary.",
        execute: function (bot, message, args) {
            const searchParameters = bot.joinParameters(args);

            URBAN_DICTIONARY.get(URBAN_DICTIONARY_API_LINK).query({
                term: searchParameters
            }).end((e, res) => {
                if (e || res.status !== SEARCH_SUCCESS_CODE) {
                    bot.error(e);
                    return message.reply(DEFAULT_API_ERROR_MESSAGE);
                }

                const ud = res.body;
                if (ud.result_type === URBAN_DICTIONARY_UNSUCCESSFUL)
                    return message.reply("Unfortunately Urban Dictionary doesn't have **" + searchParameters + "** in its database.");

                const channel = message.channel;
                const fieldsTop = [
                    "**Examples**",
                    ":thumbsup: " + `${ud.list[0].thumbs_up}`,
                ];
                const fieldsBottom = [
                    ud.list[0].example,
                    ":thumbsdown: " + `${ud.list[0].thumbs_down}`,
                ];

                bot.createEmbedFromMessage(message,
                    channel,
                    ud.list[0].word,
                    "Urban Dictionary",
                    URBAN_DICTIONARY_ICON,
                    URBAN_DICTIONARY_ICON,
                    ud.list[0].permalink,
                    ud.list[0].permalink + "\n" + ud.list[0].definition,
                    "Urban Dictionary search conducted by " + message.author.username,
                    message.author.avatarURL,
                    null,
                    null,
                    fieldsTop,
                    fieldsBottom);
            });
        }
    }
};

function getPollInfo(bot, message, existingPoll, isNew) {
    existingPoll.getVotes()
        .then((poll) => {
            const channel = message.channel;

            const pollLink = STRAWPOLL_PREFIX + poll.id;
            const description = DEFAULT_DESCRIPTION +
                `**__${poll.title}__**\n\n` +
                CAPTCHA + ((poll.captcha) ? YES : NO) + "\n" +
                MULTI + ((poll.multi) ? YES : NO) + "\n" +
                IP_CHECK + ((poll.dupcheck) ? YES : NO) + "\n" +
                pollLink;


            const fieldsTop = [];
            const fieldsBottom = [];

            let size = poll.options.length;
            for (let i = 0; i < size; i++) {
                fieldsTop.push(OPTION + (i + 1) + ". " + poll.options[i]);
                fieldsBottom.push(VOTES + poll.votes[i]);
            }

            bot.createEmbedFromMessage(message,
                channel,
                poll.title,
                STRAWPOLL_NAME,
                STRAWPOLL_ICON_URL,
                STRAWPOLL_ICON_URL,
                pollLink,
                description,
                "Poll " + ((isNew) ? " created " : "information requested ") + " by " + message.author.username,
                message.author.avatarURL,
                null,
                bot.yellow_hex,
                fieldsTop,
                fieldsBottom);

            bot.info("Strawpoll - " + poll.title + " has been imported by " + message.author.username + ".");
        });
}

function hasValidPollParameters(pollText) {
    return pollText && pollText.includes(POLL_CATEGORY_SPLIT) && pollText.includes(POLL_CHOICES_SPLIT);
}

function intializePoll(bot, pollText, allowMulti, allowCaptcha) {
    const msg = pollText.split(POLL_CATEGORY_SPLIT);
    const title = msg[0];
    const choices = bot.joinParameters(msg.slice(1)).split(POLL_CHOICES_SPLIT);

    return new STRAWPOLL(
        title,
        choices,
        allowMulti, // Allow multiple option selection?
        STRAWPOLL.DUPCHECK_PERMISSIVE, // Strawpoll.DUPCHECK_DISABLED / Strawpoll.DUPCHECK_PERMISSIVE / Strawpoll.DUPCHECK_NORMAL
        allowCaptcha // Allow captcha?
    );
}

function setPollID(poll, id) {
    poll.id = id;
}

exports.commands = COMMANDS;