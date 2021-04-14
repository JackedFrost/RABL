const loginButton = document.getElementById('loginButton')
const user = "test";

loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    var message = "There was an error trying to login, please check your username and password, and try again"
    
    try {
      if (rabl_rust.login(username, password)) {
        rabl_rust.serialize_login(username, password);
        location.replace("../Views/main.html")
      } else {
        console.log('login failed')
        alert(message);
      }
    } catch (login_error) {
      alert(message);
      console.log(login_error);
    }
})

