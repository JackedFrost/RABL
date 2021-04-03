var addon = require('../native');

//module.exports = addon.login;

const loginButton = document.getElementById('loginButton')

loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    if(addon.login(username, password)){
        location.replace("../Views/main.html")
    }
    else{
     console.log('failed')   
    }

});

function sendToServer(messageInput, userName){
    var sender = userName;
    var reciever = "targetName";
    addon.send_message(sender,reciever,messageInput);
}
function recieveFromServer(){
    // lol he thinks i am actually gonna code!?!
}



