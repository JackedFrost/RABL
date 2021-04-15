const loginButton = document.getElementById('loginButton')
const user = "test";

  try{
    let storedUser = rabl_rust.deserialize_login();
    if(storedUser.Username != null || storedUser.Username != undefined){
     let username = storedUser.Username.toString();
     let password = storedUser.Password.toString();
     rabl_rust.login(username, password);
     location.replace("../Views/friends.html")
    }
  }catch(error){
   console.log("No user info has been saved")
  }


loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    var message = "There was an error trying to login, please check your username and password, and try again"

    try {
      if (rabl_rust.login(username, password)) {
        location.replace("../Views/friends.html")
      } else {
        console.log('login failed')
        alert(message);
      }
    } catch (login_error) {
      alert(message);
      console.log(login_error);
    }
})