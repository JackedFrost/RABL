/*Elements to use
Friend Name/picture
Saved Messages


*/

var friendName = getFriendName();
//header bar label for current Friends DM
var bannerText = document.getElementById('bannerText');
bannerText.innerText = `Chatting With ${friendName}`;

function getFriendName(){
    let usp = new URLSearchParams(window.location.search);
    var friendName = usp.get('friend');
    return friendName
}