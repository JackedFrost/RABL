var userImage = "../placeholder/images/treti.png";
var messageList = document.getElementById("messageList");
var chatWindow = document.getElementById("chatWindow");
const sqlite3 = require('sqlite3').verbose();
var sender = "test";
let storedUsername = rabl_rust.deserialize_login();
console.log(storedUsername);
let username = storedUsername.Username.toString();

//Looks for messages in the datbase if it exists, if not it will make the database
try{getSavedMessages(userImage, sender);}catch(error){createTableIfNotExists(sender);}
getMessages(sender);
setInterval(function(){
    getMessages(sender);
},500)

function createMessage(messageInput, messageTime, userImage, username) {
    var html= `<div class="flex mx-5 my-3 py-4 border-5 border-gray-700"><div class="flex-none">
            <a href="#"><img src=" ${userImage}"alt=" ${username}_img" class="w-10 h-10 rounded-xl"></img></a>
            </div><div class="ml-5"><div>
            <a href="#" class="text-white hover:underline">${username}</a>
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
function update() {
    var messageInput = document.forms['MessageForm']['messageInput'].value = "";
    autoScroll();
    return messageInput;
}
function autoScroll(){
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


function sendMessage() {
    var messageInput = document.forms['MessageForm']['messageInput'].value;
    if (messageInput.charAt(0) =='/'){
       messageInput = commands(messageInput)
    }
    
    try {
        rabl_rust.send_message(username, "test", messageInput);
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
        case "\/tyler":
            commandOut = "(づ￣ ³￣)づC====B";
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
function getMessages(){
    var recievedMessages = rabl_rust.poll_messages(username.Username)
    for(i = 0; i <recievedMessages.length; i++){
        let content = recievedMessages[i].Content
        let source = recievedMessages[i].Source
        var messageTime = getMessageTime();
        var userImage = "../placeholder/images/treti.png"
        message = createMessage(content, messageTime, userImage, source);
        var messageSlot = document.createElement('li');
        messageSlot.innerHTML = message;
        messageList.appendChild(messageSlot);
        if (content != null || undefined ){
        saveMessage(content, messageTime, source);
        autoScroll();
        }
    }
}

// Database functions//
function createTableIfNotExists(sender){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    chatLog.serialize(function(){
        chatLog.run(`CREATE TABLE IF NOT EXISTS ${sender}_logs (messageID INT,username VARCHAR, message TEXT, messageTime VARCHAR)`);
    })
}
function saveMessage(messageInput, messageTime,source){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    chatLog.serialize(function(){
        chatLog.run(`CREATE TABLE IF NOT EXISTS ${source}_logs (messageID INT,username VARCHAR, message TEXT, messageTime VARCHAR)`);
    var Id = 1;
    var messageID = Id++;
    try{
        var statement = chatLog.prepare(`INSERT INTO ${source}_logs VALUES (?,?,?,?)`);
        statement.run(messageID, source, messageInput, messageTime);
        statement.finalize();
    }catch (error){
        console.log(error)
        alert("There was a problem storing the message, message will be deleted from chat window on refresh")
    }   
});
}

function getSavedMessages(userImage,sender){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    let query =(`SELECT * from ${sender}_logs`)
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












