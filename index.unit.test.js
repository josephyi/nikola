//const rewire = require('rewire');


jest.mock('https');
const {handler} = require('./index');  

test('valid login', async () => {
  process.env.USERNAME = 'test';
  process.env.PASSWORD = 'test';
  process.env.VEHICLE_ID = 'abc';
  let caughtError;
  const s = handler({clickType: 'SINGLE'}, null, error => caughtError = error);
  expect(caughtError).toBeFalsy();
});

test('invalid login', async () => {
    process.env.USERNAME = 'est';
    process.env.PASSWORD = 'est';
    process.env.VEHICLE_ID = 'abc';
    const s = handler({clickType: 'SINGLE'}, null, error => expect(error).toBeTruthy());
  });

  