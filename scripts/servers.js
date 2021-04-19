var servers = rabl_rust.poll_servers(username);

for(i = 0; i <servers.length; i++){
 server = servers[i];
 updateGUI(server)
  }

function updateGUI(server){
  const queryStr = `room=${server}`;
  let usp = new URLSearchParams(queryStr);
  var serversList = document.getElementById("serversList");
  var html = `<li class="mt-3"><a href="server.html?${usp}"><img src="../placeholder/images/${server}.jpg" alt="RABL"
                class="w-12 h-12 rounded-xl mx-auto"></a></li>`
  var serverSlot = document.createElement('li');
  serverSlot.innerHTML = html;
  serversList.appendChild(serverSlot);
}

