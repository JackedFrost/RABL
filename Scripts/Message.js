//var sqlite3 = require("sqlite3");

var userImage = "../placeholder/images/treti.png";
var userName = "Treti";
var messageList = document.getElementById("messageList");
var chatWindow = document.getElementById("chatWindow");
var chatLog = new sqlite3.Database('logs');

function createMessage(messageInput, messageTime, userImage, userName) {
    var html= `<div class="flex mx-5 my-3 py-4 border-5 border-gray-700"><div class="flex-none">
            <a href="#"><img src=" ${userImage}"alt=" ${userName}_img" class="w-10 h-10 rounded-xl"></img></a>
            </div><div class="ml-5"><div>
            <a href="#" class="text-white hover:underline">${userName}</a>
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
    //This line is supposed to automatically keep the page scrolling to the most recent message
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageInput;
}
function sendMessage() {
    var messageInput = document.forms['MessageForm']['messageInput'].value;
    if (messageInput.charAt(0) =='/'){
       messageInput = commands(messageInput)
    }

    var messageTime = getMessageTime();
    var message = createMessage(messageInput, messageTime, userImage, userName);
    var messageSlot = document.createElement('li');
    messageSlot.innerHTML = message;
    messageList.appendChild(messageSlot);
    update();
    return false;
}
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
function sendToServer(message){
    var msg = `msg.treti.${message}`
    
}
function recieveFromServer(){
    // lol he thinks i am actually gonna code!?!
}
/*function createLogs(){
    chatLog.serialize(function(){
        chatLog.run("CREATE TABLE logs (messageID INT,userName VARCHAR, message TEXT, messageTime VARCHAR, userImage VARCHAR)");
    });
}
function saveMessage(messageInput, messageTime, userImage, userName){
    var statement = chatLog.prepare("INSERT INTO logs VALUES (?,?,?,?,?)");
    statement.run(messageID, userName, messageInput, messageTime, userImage);
    statement.finalize();
}
function getSavedMessages(){
    chatlog.each("SELECT username, messageTime, userImage, message from logs", function(err,row){
        createMessage(row.message, row.messageTime, row.userImage, row.userName);
    });
    chatlog.close();
}
*/





