var addon = require('../native');

const testButton = document.getElementById('testButton')

testButton.addEventListener('click', () => {
    console.log('random shit')
    console.log(addon.hello())
});
