/*
This will be responsible for populating the friends.html

Elements to Use:
json that holds all friends information

*/

function getFriends(){
  //get the friends list from Rust
}

var html = `<li class="text-gray-500 px-2 hover:text-gray-200 hover:bg-gray-750 py-1 my-2">
<a href="" class="flex items-center">
  <span><a href="#"><img src="../placeholder/images/treti.png" class= "w-8 h-8 rounded-xl"></a></span>
  <span class="ml-2">Treti</span>
</a>
</li>`
for(friend in friends){
  var friendSlot = document.createElement('li');
  friendSlot.innerHTML = html;
  friendsList.appendChild(friendSlot);
}