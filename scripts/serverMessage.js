var retrievedServerName = getServerName();
var serverName = retrievedServerName.slice(7, retrievedServerName.length)
var bannerText = document.getElementById('serverName');
bannerText.innerText = `${serverName}`;

function getServerName(){
    let usp = new URLSearchParams(window.location.search);
    var serverName = usp.get('room');
    return serverName
}