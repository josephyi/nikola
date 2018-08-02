//const rewire = require('rewire');
const fn = require('./index');


jest.mock('https');
  
test('placeholder', async () => {
  fn.handler({clickType: 'SINGLE'});

});
