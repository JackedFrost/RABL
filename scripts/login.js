const loginButton = document.getElementById('loginButton')

loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    try {
      if (rabl_rust.login(username, password)) {
        location.replace("../Views/main.html")
      } else {
        console.log('login failed')
      }
    } catch (login_error) {
      console.log(login_error);
    }
})
