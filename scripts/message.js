var userImage = "../placeholder/images/treti.png";
var userName = "test";
var messageList = document.getElementById("messageList");
var chatWindow = document.getElementById("chatWindow");
const sqlite3 = require('sqlite3').verbose();
var tempName = "test"

getSavedMessages(userImage, tempName);
getMessages(userName);
setInterval(function(){
    getMessages(userName);
},500)

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
function update(chatWindow) {
    var messageInput = document.forms['MessageForm']['messageInput'].value = "";
    //This line is supposed to automatically keep the page scrolling to the most recent message
    //chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageInput;
}
function sendMessage() {
    var messageInput = document.forms['MessageForm']['messageInput'].value;
    if (messageInput.charAt(0) =='/'){
       messageInput = commands(messageInput)
    }
    try {
        rabl_rust.send_message("test", "test", messageInput);
        //console.log(rabl_rust.poll_messages("test"));
    } catch (send_message_error) {
        console.log(send_message_error)
    }
    var messageTime = getMessageTime();
    var message = createMessage(messageInput, messageTime, userImage, userName);
    var messageSlot = document.createElement('li');
    messageSlot.innerHTML = message;
    messageList.appendChild(messageSlot);
    update();
    saveMessage(messageInput, messageTime, userName);
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
function getMessages(){
    var recievedMessages = rabl_rust.poll_messages(userName)
    console.log(recievedMessages);
    
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
        }
    }
}


function saveMessage(messageInput, messageTime,source){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    chatLog.serialize(function(){
        chatLog.run(`CREATE TABLE IF NOT EXISTS ${source}_logs (messageID INT,userName VARCHAR, message TEXT, messageTime VARCHAR)`);
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

function getSavedMessages(userImage,tempName){
    let chatLog = new sqlite3.Database("./logs.db", sqlite3.OPEN_READWRITE| sqlite3.OPEN_CREATE);
    let query =(`SELECT * from ${tempName}_logs`)
    chatLog.all(query, [], (err,rows) =>{
        if (err){
            console.log(err);
            return;
        }
        rows.forEach((row) => {
        console.log(rows);
        var message = createMessage(row.message,row.messageTime, userImage, row.userName);
        var messageSlot = document.createElement('li');
        messageSlot.innerHTML = message;
        messageList.appendChild(messageSlot);
        });
    });
    chatLog.close();
}












