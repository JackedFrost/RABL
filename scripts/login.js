const loginButton = document.getElementById('loginButton')

loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    var message = "There was an error trying to login, please check your username and password, and try again"

    try {
      if (false) {
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