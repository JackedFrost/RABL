getFriendsList();

function getFriendsList(){
var friends = rabl_rust.poll_friends(username);

for(i = 0; i <friends.length; i++){
 friend = friends[i];
 updateGUI(friend)
  }
}

function updateGUI(friend){
  const queryStr = `friend=${friend}`;
  let usp = new URLSearchParams(queryStr);
  var friendsList = document.getElementById("friendsList");
  var html = `<li class="text-gray-500 px-2 hover:text-gray-200 hover:bg-gray-750 py-1 my-2">
  <a href="" class="flex items-center">
  <span><a href="directMessage.html?${usp}"><img src="../placeholder/images/${friend}.jpg" class= "w-8 h-8 rounded-xl"></a></span>
  <span class="ml-2">${friend}</span>
  </a>
  </li>`
  
  var friendSlot = document.createElement('li');
  friendSlot.innerHTML = html;
  friendsList.appendChild(friendSlot);
}






