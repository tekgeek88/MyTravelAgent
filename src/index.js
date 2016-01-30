/**
    Created by Carl Argabright, Aaron Harris, Sinh Le, and Daniel M.
    
    Consumer Key    G8VVfMp8ufGIALoOz236921b4Jt3NmdK
    Consumer Secret mAeou3rVbnQresAi 
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Web service: communicate with an external web service to get events for specified days in history (Wikipedia API)
 * - Pagination: after obtaining a list of events, read a small subset of events and wait for user prompt to read the next subset of events by maintaining session state
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 * - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 *
 * Examples:
 * One-shot model:
 * User: "Alexa, book a flight from Seatlle to las vegas on January 30th"
 * User:  "Alexa, ask History Buff what happened on August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open My Travel Agent"
 * Alexa: "History Buff. What day do you want events for?"
 * User:  "August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User:  "Yes."
 * Alexa: "In 1995, Bosnian war [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 */


/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.echo-sdk-ams.app.34bdad6e-28e4-4c99-81ed-677c4da11366';

var https = require('https');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'http://terminal2.expedia.com/x/';

/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 3;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

/**
 * MyTravelAgentSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MyTravelAgentSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MyTravelAgentSkill.prototype = Object.create(AlexaSkill.prototype);
MyTravelAgentSkill.prototype.constructor = MyTravelAgentSkill;

MyTravelAgentSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("MyTravelAgentSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

MyTravelAgentSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("MyTravelAgentSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

MyTravelAgentSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

MyTravelAgentSkill.prototype.intentHandlers = {

    "GetFirstEventIntent": function (intent, session, response) {
        handleFirstEventRequest(intent, session, response);
    },

    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        //var speechText = "With History Buff, you can get historical events for any day of the year.  " +
        //    "For example, you could say today, or August thirtieth, or you can say exit. Now, which day do you want?";
        var speechText = "With MyTravelAgent, you can get prices on airfare and hotels"
        var repromptText = "Which one do you want?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },
    // This is spoken when the user says, "stop"
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Thank you for using My Travel Agent.  Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    // This is spoken when the user says, "cancel"
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Thank you for using My Travel Agent, Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var cardTitle = "Hot Deals from Expedia";
    
    //var repromptText = "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?";
    var repromptText = "Your Travel Agent allows you to book a flight or hotel through Expedia. " +
            "To start, you can say, book a flight, or, book a hotel.";

    var speechText = "Your Travel Agent allows you to book a flight or hotel through Expedia. " +
            "To start, you can say, book a flight, or, book a hotel.";

    var cardOutput = "My Travel Agent. Would you like to check for airfare, or hotel bookings";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstEventRequest(intent, session, response) {

    var typeSlot = intent.slots.type;

    var speechText = "Where would you like to book a " + typeSlot + " to?";
    var repromptText = "Where would you like to book a " + typeSlot + " to?";
    var cardContent = "";
    var cardTitle = "";

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent)

}

function handleEndLocationEventRequest(intent, session, response) {

    var sessionAttributes = {};
    // Read the first 3 events, then set the count to 3
    sessionAttributes.index = paginationSize;
    var date = "";

    // If the user provides a date, then use that, otherwise use today
    // The date is in server time, not in the user's time zone. So "today" for the user may actually be tomorrow
    if (daySlot && daySlot.value) {
        date = new Date(daySlot.value);
    } else {
        date = new Date();
    }

    var prefixContent = "<p>For " + monthNames[date.getMonth()] + " " + date.getDate() + ", </p>";
    var cardContent = "For " + monthNames[date.getMonth()] + " " + date.getDate() + ", ";
    var cardTitle = "Events on " + monthNames[date.getMonth()] + " " + date.getDate();

    getJsonEventsFromWikipedia(monthNames[date.getMonth()], date.getDate(), function (events) {
        var speechText = "",
            i;
        sessionAttributes.text = events;
        session.attributes = sessionAttributes;
        if (events.length == 0) {
            speechText = "There is a problem connecting to Wikipedia at this time. Please try again later.";
            cardContent = speechText;
            response.tell(speechText);
        } else {
            for (i = 0; i < paginationSize; i++) {
                cardContent = cardContent + events[i] + " ";
                speechText = "<p>" + speechText + events[i] + "</p> ";
            }
            speechText = speechText + " <p>Wanna go deeper in history?</p>";
            var speechOutput = {
                speech: "<speak>" + prefixContent + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
        }
    });
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextEventRequest(intent, session, response) {
    var cardTitle = "More events on this day in history",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to know more about what happened on this date?",
        i;
    if (!result) {
        speechText = "With MyTravelAgent, you can get prices for hotels and airfare for any day of the year.  For example, you could say check airfare or get hotel prices. Now, which do you want?";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "There are no more events for this date. Try another date by saying <break time = \"0.3s\"/> get events for august thirtieth.";
        cardContent = "There are no more events for this date. Try another date by saying, get events for august thirtieth.";
    } else {
        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index>= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index] + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Wanna go deeper in history?";
            cardContent = cardContent + " Wanna go deeper in history?";
        }
    }
    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}

// We will implement this function to fetch our flight data from Expedia
function getJsonEventsFromWikipedia(day, date, eventCallback) {
    var url = urlPrefix + day + '_' + date;

    https.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var stringResult = parseJson(body);
            eventCallback(stringResult);
        });
    }).on('error', function (e) {
        console.log("Got error: ", e);
    });
}


// We need to implement this method to parse back the flight information from Expedia
function parseJson(inputText) {
    // sizeOf (/nEvents/n) is 10
    var text = inputText.substring(inputText.indexOf("\\nEvents\\n")+10, inputText.indexOf("\\n\\n\\nBirths")),
        retArr = [],
        retString = "",
        endIndex,
        startIndex = 0;

    if (text.length == 0) {
        return retArr;
    }

    while(true) {
        endIndex = text.indexOf("\\n", startIndex+delimiterSize);
        var eventText = (endIndex == -1 ? text.substring(startIndex) : text.substring(startIndex, endIndex));
        // replace dashes returned in text from Wikipedia's API
        eventText = eventText.replace(/\\u2013\s*/g, '');
        // add comma after year so Alexa pauses before continuing with the sentence
        eventText = eventText.replace(/(^\d+)/,'$1,');
        eventText = 'In ' + eventText;
        startIndex = endIndex+delimiterSize;
        retArr.push(eventText);
        if (endIndex == -1) {
            break;
        }
    }
    if (retString != "") {
        retArr.push(retString);
    }
    retArr.reverse();
    return retArr;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MyTravelAgent Skill.
    var skill = new MyTravelAgentSkill();
    skill.execute(event, context);
};

