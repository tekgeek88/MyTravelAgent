/* 

    This is index.js

    main: http://collabedit.com/hsyx6, 
    index.js: http://collabedit.com/vd25f, 
    intentSchema: http://collabedit.com/hfj4j,
    SampleUtterances: http://collabedit.com/c3cq7

*/

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
var APP_ID = "amzn1.echo-sdk-ams.app.c4a0b7ae-c4c3-4602-95a2-8613f5b818eb";

// var https = require('https');
var http = require('http');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = "http://terminal2.expedia.com/x/";

/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 3;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

var customer = {}

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


    "GetLocationsForTravel": function(intent, session, response) {
        handleGetLocationsRequest(intent, session, response);
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
    
    var repromptText = "Your Travel Agent allows you to book a flight or hotel through Expedia. " +
            "To start, you can say, book a flight.";

    var speechText = "Your Travel Agent allows you to book a flight or hotel through Expedia. " +
            "To start, you can say, book a flight.";

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

    var speechText = "Where would you like to travel from and to?";
    var repromptText = "Where would you like to travel from and to?";
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

function handleGetLocationsRequest(intent, session, response){
    var startLocation = intent.slots.startLocation;
    var endLocation = intent.slots.endLocation

    console.log(endLocation);

    var sessionAttributes = {};

    // Read the first 3 events, then set the count to 3
    sessionAttributes.index = paginationSize;

    var cardContent = "";
    var cardTitle = "Trip from " + startLocation + " to " + endLocation;
    
    getAirportsFromExpedia(startLocation, endLocation, function (airports) {
        var speechText = "";

        if (airports.length == 0) {
            speechText = "There is a problem connecting to Expedia at this time. Please try again later.";
            cardContent = speechText;
            response.tell("Error with JSON call");
        } else {

            var majorAirports = [];

            for (a in airports) {
                if(!airports[a].isMinorAirport){
                    majorAirports.push(airports[a].a);
                    console.log(majorAirports);
                }
            }


            speechText = "Okay. We will start planning your trip to " + endLocation.value + ". When would you like to go?";
            var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

            var repromptOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
        }

    })

}

// We will implement this function to fetch our flight data from Expedia
function getAirportsFromExpedia(startLocation, endLocation, eventCallback) {

    var url = urlPrefix + "suggestions/flights?query=seattle&apikey=G8VVfMp8ufGIALoOz236921b4Jt3NmdK";

    http.get(url, function(res) {
        var body = '';

        res.on('data', function (apiData) {
            body += apiData;
        });

        res.on('end', function () {
            eventCallback(JSON.parse(body).sr);
        });

    }).on('error', function (e) {

        console.log("Got error: ", e);

    });

}

function addLegsToOffers(result) {
    var legObj = {};
    result.legs.forEach(function(el, index, array) { 
         legObj[el.legId] = el;
    });
    
    return result.offers.map(function(offer, index, array) {
        offer.legs = el.legIds.map(function(legId) {
            return legObj[legId];
        });
        return el;
    });
    return result;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MyTravelAgent Skill.
    var skill = new MyTravelAgentSkill();
    skill.execute(event, context);
};