const https = require('https');
const qs = require('querystring');

const GRANT_TYPE = 'password';
const CLIENT_ID = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';
const CLIENT_SECRET = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';

const singleClick = 'SINGLE';
const doubleClick = 'DOUBLE';
const longClick = 'LONG';

exports.handler = async (event, context, callback) => {
  try {
    const client = await createTeslaClient(process.env.USERNAME, process.env.PASSWORD, process.env.VEHICLE_ID);
    const vehicle = await client.vehicle();

    // wake up vehicle
    if (vehicle.response.state === 'asleep') {
      await wakeupVehicle(client);
    }

    await handleClick(event.clickType, client);

    await client.logout();
  } catch (error) {
    callback(error);
  }
};

const handleClick = async (clickType, client) => {
  if (clickType === singleClick) {
    await Promise.all([client.chargePortDoorOpen(), client.actuateTrunk('rear')]);
    await pause(1000);
    await client.flashLights();
  }

  if (clickType === doubleClick) {
    await client.doorUnlock();
    await pause(1000);
    await client.flashLights();
  }
};

const wakeupVehicle = async client => {
  await client.wakeup();
  await pause(10000);
  let awake = false;
  do {
    await pause(1000);
    const updatedVehicle = await client.vehicle();
    awake = updatedVehicle.response.state === 'online';
  } while (!awake);
};

pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const createTeslaClient = async (email, password, vehicleId) => {
  const {
    access_token
  } = await authenticate(email, password);
  return new TeslaClient(access_token, vehicleId);
}

class TeslaClient {
  constructor(accessToken, vehicleId) {
    this.accessToken = accessToken;
    this.vehicleId = vehicleId;
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    };
    this.vehicleUriPath = `/api/1/vehicles/${this.vehicleId}`;
  }

  logout() {
    return teslaRequest({
      method: 'POST',
      path: '/oauth/revoke',
      headers: this.headers
    });
  }

  vehicle() {
    return teslaRequest({
      method: 'GET',
      path: this.vehicleUriPath,
      headers: this.headers
    });
  }

  actuateTrunk(which_trunk) {
    return this.command('actuate_trunk', {
      which_trunk
    });
  }

  chargePortDoorOpen() {
    return this.command('charge_port_door_open');
  }

  doorUnlock() {
    return this.command('door_unlock');
  }

  wakeup() {
    return this.command('wake_up');
  }

  flashLights() {
    return this.command('flash_lights');
  }

  command(commandUri, postData) {
    return teslaRequest({
      method: 'POST',
      path: `${this.vehicleUriPath}/command/${commandUri}`,
      accessToken: this.accessToken,
      postData: JSON.stringify(postData),
      headers: this.headers
    });
  }
}

const promisedRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, response => {
      const body = [];
      console.log(`${response.statusCode} ${options.path}`);
      if (response.statusCode === 401) {
        reject(new Error('Invalid credentials.'));
      } else {
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => resolve(JSON.parse(body.join(''))));
      }
    });

    if (postData) {
      req.write(postData);
    }

    req.on('error', (err) => reject(err));
    req.end();
  });
};

const teslaRequest = ({
  method,
  path,
  headers,
  postData
}) => {
  const options = {
    hostname: 'owner-api.teslamotors.com',
    path,
    method,
    headers
  }

  return promisedRequest(options, postData);
};

const authenticate = (email, password) => {
  const postData = qs.stringify({
    email,
    password,
    grant_type: GRANT_TYPE,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  };

  return teslaRequest({
    method: 'POST',
    path: '/oauth/token',
    headers,
    postData
  });
};