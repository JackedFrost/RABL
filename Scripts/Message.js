var message = createBox("Hello World", "12:22", "../placeholder/images/treti.png","Treti")
var messageTime = getMessageTime();
var userImage = "../placeholder/images/treti.png"
var userName = "Treti"

var messageContent = document.getElementById(messageInput).value;

document.querySelector(messageContent).addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        $(".messageList").append(message)
    }
});


function createMessage(messageContent, messageTime, userImage, userName){
    var html = "";
    html += 
    '<div class="flex mx-5 my-3 py-4 border-5 border-gray-700">' +
                '<div class="flex-none">' +
                  '<a href="#"><img src="' + userImage +'"alt="'+userName+"_img" +'" class="w-10 h-10 rounded-xl"></img></a>' +
                '</div>' +
                '<div class="ml-5">' +
                  '<div>' +
                    '<a href="#" class="text-white hover:underline">'+userName+'</a>' +
                    '<span class="text-xs text-gray-600 ml-1">'+messageTime+'</span>' +
                  '</div>' +
                  '<div>' +
                  '<div>'+ messageContent +'</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
    return html;
}
function getMessageTime(){
    var tempTime = new Date()
    var AMPM;
    if(tempTime.getHours() > 12){
        AMPM = "PM"
    }
    else{
        AMPM = "AM"
    }
    var messageTime = tempTime.getHours() + ":" + tempTime.getMinutes() + AMPM
    return messageTime;
}


