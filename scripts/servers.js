let storedUsername = rabl_rust.deserialize_login();
let username = storedUsername.Username.toString();

getServersList();

function getServersList(){
var servers = rabl_rust.poll_servers(username);

for(i = 0; i <servers.length; i++){
 server = servers[i];
 updateGUI(server)
  }
}

function updateGUI(server){
  const queryStr = `server=${server}`;
  let usp = new URLSearchParams(queryStr);
  console.log(usp.toString());
  var serversList = document.getElementById("serversList");
  var html = `<li class="mt-3"><a href="main.html?${usp}"><img src="../placeholder/images/server1.jpg" alt="RABL"
                class="w-12 h-12 rounded-xl mx-auto"></a></li>`
  console.log(html)
  var serverSlot = document.createElement('li');
  serverSlot.innerHTML = html;
  serversList.appendChild(serverSlot);
}