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
    console.log(error);
  }
};

const handleClick = async (clickType, client) => {
  if (clickType === singleClick) {
    await client.flashLights();
    await pause(1000);
    await Promise.all([client.chargePortDoorOpen(), client.actuateTrunk('rear')]);
    await pause(1000);
    await client.flashLights();
  }

  if (clickType === doubleClick) {
    await client.flashLights();
    await pause(1000);
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

const pause = milliseconds => {
  new Promise(resolve => setTimeout(resolve, milliseconds))
};

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
  }

  logout() {
    return post({
      path: '/oauth/revoke',
      accessToken: this.accessToken
    });
  }

  vehicle() {
    return get({
      path: `/api/1/vehicles/${this.vehicleId}`,
      accessToken: this.accessToken
    });
  }

  actuateTrunk(which_trunk) {
    return command({
      accessToken: this.accessToken,
      id: this.vehicleId,
      command: 'actuate_trunk',
      postData: {
        which_trunk
      }
    });
  }

  chargePortDoorOpen() {
    return command({
      accessToken: this.accessToken,
      id: this.vehicleId,
      command: 'charge_port_door_open'
    });
  }

  doorUnlock() {
    return command({
      accessToken: this.accessToken,
      id: this.vehicleId,
      command: 'door_unlock'
    });
  }

  wakeup() {
    return command({
      accessToken: this.accessToken,
      id: this.vehicleId,
      command: 'wake_up'
    });
  }

  flashLights() {
    return command({
      accessToken: this.accessToken,
      id: this.vehicleId,
      command: 'flash_lights'
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

const authenticatedRequest = ({
  method,
  path,
  accessToken,
  postData
}) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=utf-8'
  };

  return teslaRequest({
    method,
    path,
    headers,
    postData: JSON.stringify(postData)
  });
};

const get = ({
  path,
  accessToken,
  postData
}) => authenticatedRequest({
  method: 'GET',
  path,
  accessToken,
  postData
});
const post = ({
  path,
  accessToken,
  postData
}) => authenticatedRequest({
  method: 'POST',
  path,
  accessToken,
  postData
});

const command = ({
  accessToken,
  id,
  command,
  postData
}) => post({
  path: `/api/1/vehicles/${id}/command/${command}`,
  accessToken,
  postData
});

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