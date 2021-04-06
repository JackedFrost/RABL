const loginButton = document.getElementById('loginButton')

loginButton.addEventListener('click', () => {
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    if(rabl_rust.login(username, password)){
        location.replace("../Views/main.html")
    } else {
     console.log('failed')   
    }
})
