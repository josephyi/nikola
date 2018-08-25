jest.mock('https');

const {
  handler
} = require('./index');

jest.useFakeTimers();

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('single click', async () => {
  process.env.USERNAME = 'test';
  process.env.PASSWORD = 'test';
  process.env.VEHICLE_ID = 'abc';
  let caughtError;
  handler({
    clickType: 'SINGLE'
  }, null, error => caughtError = error);
  // ¯\_(ツ)_/¯
  await flushPromises();
  jest.runAllTimers();
  await flushPromises();
  jest.runAllTimers();
  expect(caughtError).toBeFalsy();
  expect(setTimeout).toHaveBeenCalledTimes(2);
});

test('double click', async () => {
  process.env.USERNAME = 'test';
  process.env.PASSWORD = 'test';
  process.env.VEHICLE_ID = 'abc';
  let caughtError;
  handler({
    clickType: 'DOUBLE'
  }, null, error => caughtError = error);
  // ¯\_(ツ)_/¯
  await flushPromises();
  jest.runAllTimers();
  await flushPromises();
  jest.runAllTimers();
  expect(caughtError).toBeFalsy();
  expect(setTimeout).toHaveBeenCalledTimes(2);
});

test('invalid login', async () => {
  process.env.USERNAME = 'est';
  process.env.PASSWORD = 'est';
  process.env.VEHICLE_ID = 'abc';
  const s = handler({
    clickType: 'SINGLE'
  }, null, error => expect(error).toBeTruthy());
});