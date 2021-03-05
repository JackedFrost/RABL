var addon = require('../native');

//module.exports = addon.login;

const testButton = document.getElementById('testButton')

testButton.addEventListener('click', () => {
    console.log('random shit')
    console.log(addon.login("test", "test"))
});
