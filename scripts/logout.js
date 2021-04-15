const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', () =>{
  let message = "There was an error trying to logout!"
  try{
    //rabl_rust.purge_userdat();
    location.replace("../Views/login.html")
  }catch(logout_error){
    alert(message);
    console.log(logout_error);
  }
})