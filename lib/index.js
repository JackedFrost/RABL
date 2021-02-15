var addon = require('../native');
const testButton = document.getElementById('loginButton')
testButton.addEventListener('click', () => {
console.log(addon.hello());
})
