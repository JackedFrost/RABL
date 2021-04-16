//Used as variables around project
let storedUsername = rabl_rust.deserialize_login();
let username = storedUsername.Username.toString();
var status = "This is filler for now";

//Populate GUI
var usernameField = document.getElementById("username_field");
var userStatus =document.getElementById("userStatus");
usernameField.innerText = username;
userStatus.innerText = status;
