var addon = require('../native');

//module.exports = addon.login;

const testButton = document.getElementById('testButton')

testButton.addEventListener('click', () => {
    console.log('random shit')
    //
    console.log(addon.login("test", "test"))
});
function sendToServer(messageInput, userName){
    var sender = userName;
    var reciever = "targetName";
    addon.send_message(sender,reciever,messageInput);
}
function recieveFromServer(){
    // lol he thinks i am actually gonna code!?!
}



