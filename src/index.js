/* 

    Created by Carl Argabright, Aaron Harris, Sinh Le, and Daniel M.
    Expedia Hackathon 2016
    
    main: http://collabedit.com/hsyx6, 
    index.js: http://collabedit.com/vd25f, 
    intentSchema: http://collabedit.com/hfj4j,
    SampleUtterances: http://collabedit.com/c3cq7

    This Lambda function handles a Alexa Skill requests that:
 
  - Web service: communicate with an external web service to get events for specified days in history (Wikipedia API)
  - Pagination: after obtaining a list of events, read a small subset of events and wait for user prompt to read the next subset of events by maintaining session state
  - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
  - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 
*/

var APP_ID = "amzn1.echo-sdk-ams.app.c4a0b7ae-c4c3-4602-95a2-8613f5b818eb";

var API_KEY = "G8VVfMp8ufGIALoOz236921b4Jt3NmdK";

var http = require('http');

var AlexaSkill = require('./AlexaSkill');

var urlPrefix = "http://terminal2.expedia.com/x/";

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

    "GetHotelsIntent": function(intent, session, response) {
        handleGetHotelsRequest(intent, session, response);
    },

    "SetHotelIntent": function(intent, session, response) {
        handleSetHotelRequest(intent, session, response);
    },

    "GetDepartureDateIntent": function(intent,session,response){
        handleDepartureDateRequest(intent,session,response);
    },

    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
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
                speech: "Ok. Thank you for using My Travel Agent.  Goodbye",
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

// Handles onLaunch skill behavior
function getWelcomeResponse(response) {

    var cardTitle = "Hot Deals from Expedia";

    var responseText = "Your Travel Agent allows you to book a flight or hotel through Expedia. " +
            "To start, you can say, book a flight.";

    var cardOutput = "My Travel Agent. Would you like to check for airfare, or hotel bookings";

    var speechOutput = {
        speech: "<speak>" + responseText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: responseText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

function handleFirstEventRequest(intent, session, response) {

    var responseText = "Where would you like to travel from and to?";
    var cardContent = "";
    var cardTitle = "";

    var speechOutput = {
        speech: "<speak>" + responseText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: responseText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent)

}

function  handleSetHotelRequest(intent, session, response) {

    var responseText = "Ok, I have booked your hotel and sent you a confirmation.";
    var cardContent = "Your hotel reservation";
    var cardTitle = "<a href='https://www.expedia.com/Orange-County-Hotels-Anaheim-Majestic-Garden-Hotel.h24131.Hotel-Information'>https://www.expedia.com/Orange-County-Hotels-Anaheim-Majestic-Garden-Hotel.h24131.Hotel-Information</a>";

    var speechOutput = {
        speech: "<speak>" + responseText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: responseText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.tellWithCard(speechOutput, cardTitle, cardContent)

}

function handleGetLocationsRequest(intent, session, response){

    var sessionAttributes = {
        startLocation: intent.slots.startLocation.value,
        endLocation: intent.slots.endLocation.value
    };

    var cardContent = "";
    var cardTitle = "Trip from " + sessionAttributes.startLocation + " to " + sessionAttributes.endLocation;

    getAirportByCity(sessionAttributes.startLocation, function (startingAirports) {

        sessionAttributes.startingAirport = startingAirports;
     
        getAirportByCity(sessionAttributes.endLocation, function(endingAirports){

            if (startingAirports.length == 0 || endingAirports.length == 0) {

                speechText = "There is a problem connecting to Expedia at this time. Please try again later.";
                cardContent = speechText;
                response.tell("Error with JSON call");

            } else {

                sessionAttributes.endingAirport = endingAirports;

                var responseText = "Okay. We will start planning your trip to " + sessionAttributes.endLocation + ". When would you like to go?";

                var speechOutput = {
                    speech: "<speak>" + responseText + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };

                var repromptOutput = {
                    speech: responseText,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };

                response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
            }
        });   
    });
}

function handleDepartureDateRequest(intent, session, response){

    var sessionAttributes = session.attributes;
    sessionAttributes.departureDate = intent.slots.travelDate.value;

    var responseText = "Okay. We'll look for flights departing on " + sessionAttributes.departureDate + ". What kind of hotel would you prefer?";

    var speechOutput = {
        speech: "<speak>" + responseText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };

    var repromptOutput = {
        speech: responseText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.ask(speechOutput, repromptOutput);
}

function handleGetHotelsRequest(intent, session, response){

    var sessionAttributes = session.attributes;
    console.log(sessionAttributes);

    var cardContent = "";
    var cardTitle = "";
    
    var naturalSpeechQuery = intent.slots.naturalSpeechQuery.value;
    var url = urlPrefix + "nlp/results?q=" + encodeURI(naturalSpeechQuery) + "&limit=3&apikey=" + API_KEY;

    http.get(url, function( res ) {
        var data = '';
        
        res.on( 'data', function( x ) { 
            data += x; 
        });

        res.on( 'end', function() {

            var json = JSON.parse( data );
            
            // name array of the hotels
            var hotelName = json.result.hotels.map(function(hotel) { return hotel.name; });

            // array of points of interest for the location that the hotels where sourced from
            // var POIarray = json.result.pois.map(function(poi) { return poi.name; });
            
            // name array of the neighborhood where the hotel is 
            var neighborhoods = json.result.neighborhoods.map(function(index) { return index.name; });

            // confidence indicates whether the natural language query was successful - ranges from 0 to 1
            var confidence = json.result.confidence;            
            
            // construct an array of hotel objects

            var hotels = [];
            for ( var i=0 ; i < hotelName.length ; i++ ) {
                // hotels[i] = {};
                hotels[i] = hotelName[i];
                // hotels[i].neighborhood = neighborhoods[i].value
            }
            sessionAttributes.hotels = hotels;
            

            var responseText = "Here are the names of some hotels in your area. " + hotels;

            // for (i = 0; i < hotels; i++) {
            //     responseText += "<p> " + hotels[i].name + " in the " + hotels[i].neighborhood + " </p>"
            // }

            // responseText += "<p> at this location you can visit </p>"

            // for (i = 0; i < POIarray; i++) {
            //     responseText += "<p> " + POIarray[i] + " </p>"
            // }

            // responseText += "<p>Which hotel should I book?</p>";

            response += "<p>Which hotel would you like me to book?</p>"

            var speechOutput = {
                speech: "<speak>" + responseText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

            var repromptOutput = {
                speech: responseText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
            });

            // Now just construct the string to be sent back using the poi array, array of hotel objects, and perhaps use the confidence
            
    });
}

// We will implement this function to fetch our flight data from Expedia
function getAirportByCity(location, eventCallback) {

    var url = urlPrefix + "suggestions/flights?query=" + location + "&apikey=" + API_KEY;

    http.get(url, function(res) {
        var body = '';
        var majorAirports = [];

        res.on('data', function (apiData) {
            body += apiData;
        });

        res.on('end', function () {
            var airports = JSON.parse(body).sr;
            for (a in airports) {
                if(!airports[a].isMinorAirport){
                    majorAirports.push(airports[a].a);
                }
            }

            eventCallback(majorAirports);
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