//Replace with rabl_rust get_username
var username ="test";

/*grabs the friendslist from rabl_rust and turns each friend into an object to be used in
html list*/
var friends = rabl_rust.poll_friends(username);
var friendsList = document.getElementById("friendsList");
for(i = 0; i <friends.length; i++){
let friend = friends[i];
var html = `<li class="text-gray-500 px-2 hover:text-gray-200 hover:bg-gray-750 py-1 my-2">
<a href="../views/directMessage.html" class="flex items-center">
  <span><a href="#"><img src="../placeholder/images/treti.png" class= "w-8 h-8 rounded-xl"></a></span>
  <span class="ml-2">${friend}</span>
</a>
</li>`
  var friendSlot = document.createElement('li');
  friendSlot.innerHTML = html;
  friendsList.appendChild(friendSlot);
}

