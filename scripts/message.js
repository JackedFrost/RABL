var messageList = document.getElementById("messageList");
var chatWindow = document.getElementById("chatWindow");
const sqlite3 = require('sqlite3').verbose();
var windowLocation = determineLocation();

if (windowLocation == "Server"){
    var server = getLocationName();
    createTableIfNotExists(server)
    getSavedMessages(server);
}
else{
    var friend = getSenderName();
    createTableIfNotExists(friend)
    getSavedMessages(friend);
}

getMessages();
setInterval(function(){
    getMessages();
},500)


//Find what location you were directed to
function determineLocation(){
    var locationValue;
    if(document.URL.includes("server.html")){
        locationValue = "Server"
    }
    else{
        locationValue = "DM"
    }
    return locationValue;
}
function getLocationName(){
    let usp = new URLSearchParams(window.location.search);
    locationName = usp.get('room')
    return locationName
}
function getSenderName(){
    let usp = new URLSearchParams(window.location.search);
    sender = usp.get('friend')
    return friend;
    
}

//message Templating
function createMessage(messageInput, messageTime, Image, sentBy) {
    console.log(sentBy);
    var html= `<div class="flex mx-5 my-3 py-4 border-5 border-gray-700"><div class="flex-none">
            <a href="#"><img src=" ../placeholder/images/${Image}.jpg"alt=" ${sentBy}_img" class="w-10 h-10 rounded-xl"></img></a>
            </div><div class="ml-5"><div>
            <a href="#" class="text-white hover:underline">${sentBy}</a>
            <span class="text-xs text-gray-600 ml-1">${messageTime} </span></div>
            <div><div>${messageInput} </div></div></div></div></div>`;
    return html;
}

function getMessageTime() {
    var tempTime = new Date();
    var AMPM;
    if (tempTime.getHours() > 12) {
        AMPM = "PM";
        var tempTimeHours = tempTime.getHours() - 12;
    }
    else {
        AMPM = "AM";
        var tempTimeHours = tempTime.getHours();
    }
    var messageTime = `Today at ${tempTimeHours}:${tempTime.getMinutes()} ${AMPM}`;
    return messageTime;
}
//The commands function will trigger if a message is proceeded by a "/", it will trigger a switch on the message input following "/".
function commands (messageInput) {
    let commandOut;
    let duelVal = (Math.floor(Math.random() * 3));
    switch (messageInput) {
        case "\/uwu":
            commandOut = "(◡ ω ◡)";
            break;
        case "\/d20":
            commandOut = "You rolled: " + Math.floor((Math.random() * Math.floor(20)) + 1);
            break;
        case "\/disapprove":
            commandOut = "(ಠ_ಠ)";
            break;
        case "\/coin":
            commandOut = Math.random() < .5 ? "You flipped: Heads!" : "You flipped: Tails!";
            break;
        case "\/duel":
            commandOut = duelVal == 0 ? "Rock!" : duelVal == 1 ? "Paper!" : "Scissors!";
            break;
        case "\/cheat":
            commandOut = "↑ ↑ ↓ ↓ ← → ← → B A ";
            break;
        default:
            commandOut = "Invalid command.";
            break;
    }
    return commandOut;
}
// Send and Recieve Messages
function sendMessage() {
    var messageInput = document.forms['MessageForm']['messageInput'].value;
    if (messageInput.charAt(0) =='/'){
       messageInput = commands(messageInput)
    }
    if(windowLocation == "Server"){
        try {
            rabl_rust.send_server_message(username, server, messageInput);
        } catch (send_message_error) {
            console.log(send_message_error)
        }
        var messageTime = getMessageTime();
        var message = createMessage(messageInput, messageTime, username, username);
        var messageSlot = document.createElement('li');
        messageSlot.innerHTML = message;
        messageList.appendChild(messageSlot);
        update();
        saveMessage(messageInput, messageTime, username);
        return false;

    }else{
        try {
            rabl_rust.send_message(username, sender, messageInput);
        } catch (send_message_error) {
            console.log(send_message_error)
        }
        
        var messageTime = getMessageTime();
        var message = createMessage(messageInput, messageTime, userImage, username);
        var messageSlot = document.createElement('li');
        messageSlot.innerHTML = message;
        messageList.appendChild(messageSlot);
        update();
        saveMessage(messageInput, messageTime, username);
        return false;
    }
    
}

function getMessages(){
        var recievedMessages = rabl_rust.poll_messages(username)
        for(i = 0; i <recievedMessages.length; i++){
            let serverName = recievedMessages[i].Server
            if (serverName != null || serverName != undefined){
                let content = recievedMessages[i].Content
                let source = recievedMessages[i].Source
                if (content != null || content != undefined ){
                    var messageTime = getMessageTime();
                    var userImage = source;
                    message = createMessage(content, messageTime, userImage, source);
                    var messageSlot = document.createElement('li');
                    messageSlot.innerHTML = message;
                    messageList.appendChild(messageSlot);
                    saveMessage(content, messageTime, source);
                    autoScroll();
                }
            }else{
                let content = recievedMessages[i].Content
                let source = recievedMessages[i].Source
                if (content != null || content != undefined ){
                    var messageTime = getMessageTime();
                    var userImage = source;
                    message = createMessage(content, messageTime, userImage, source);
                    var messageSlot = document.createElement('li');
                    messageSlot.innerHTML = message;
                    messageList.appendChild(messageSlot);
                    saveMessage(content, messageTime, source);
                    autoScroll();    
                }
            }
        }
}


// Updating the GUI 
function update() {
    var messageInput = document.forms['MessageForm']['messageInput'].value = "";
    autoScroll();
    return messageInput;
}
function autoScroll(){
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Database functions//
function createTableIfNotExists(messageSource){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    chatLog.serialize(function(){
        chatLog.run(`CREATE TABLE IF NOT EXISTS ${messageSource}_logs (messageID INT,username VARCHAR, message TEXT, messageTime VARCHAR)`);
    })
}
function saveMessage(messageInput, messageTime,messageSource){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    if (windowLocation == "Server"){
        chatLog.serialize(function(){
            chatLog.run(`CREATE TABLE IF NOT EXISTS ${server}_logs (messageID INT,username VARCHAR, message TEXT, messageTime VARCHAR)`);
        var Id = 1;
        var messageID = Id++;
        try{
            var statement = chatLog.prepare(`INSERT INTO ${server}_logs VALUES (?,?,?,?)`);
            statement.run(messageID, messageSource, messageInput, messageTime);
            statement.finalize();
        }catch (error){
            console.log(error)
            alert("There was a problem storing the message, message will be deleted from chat window on refresh")
        }   
    });   
    }else{
        chatLog.serialize(function(){
            chatLog.run(`CREATE TABLE IF NOT EXISTS ${messageSource}_logs (messageID INT,username VARCHAR, message TEXT, messageTime VARCHAR)`);
        var Id = 1;
        var messageID = Id++;
        try{
            var statement = chatLog.prepare(`INSERT INTO ${messageSource}_logs VALUES (?,?,?,?)`);
            statement.run(messageID, messageSource, messageInput, messageTime);
            statement.finalize();
        }catch (error){
            console.log(error)
            alert("There was a problem storing the message, message will be deleted from chat window on refresh")
        }   
    });
    }
}

function getSavedMessages(userImage,messageSource){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    let query =(`SELECT * from ${messageSource}_logs`)
    chatLog.all(query, [], (err,rows) =>{
        if (err){
            console.log(err);
            return;
        }
        rows.forEach((row) => {
        var message = createMessage(row.message,row.messageTime, userImage, row.username);
        var messageSlot = document.createElement('li');
        messageSlot.innerHTML = message;
        messageList.appendChild(messageSlot);
        });
    });
    chatLog.close();
    autoScroll();
}












