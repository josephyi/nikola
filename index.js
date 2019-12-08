if (process.env.AWS_XRAY === 'true') {
  const AWSXRay = require('aws-xray-sdk');
  AWSXRay.captureHTTPsGlobal(require('https'), false);
}
const https = require('https');
const qs = require('querystring');

// CLIENT_ID and CLIENT_SECRET are not privileged and don't change often, so it's safe as is for now.
const CLIENT_ID = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';
const CLIENT_SECRET = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';
const GRANT_TYPE = 'password';

exports.handler = async (event, context, callback) => {
  try {
    const client = await createTeslaClient(process.env.USERNAME, process.env.PASSWORD, process.env.VEHICLE_ID);
    const vehicle = await client.vehicle();

    // Vehicle needs to be 'online' to accept commands.
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
  const commands = {
    SINGLE: process.env.SINGLE_CLICK,
    DOUBLE: process.env.DOUBLE_CLICK,
    LONG: process.env.LONG_CLICK
  }[clickType];
  await runCommands(client, commands);
};

const runCommands = async (client, commands) => {
  commands.split(',').forEach(async element => {
    const number = Number(element);
    if(isNaN(number)) {
      await Promise.all(element.split('&').map(concurrent => {
        COMMANDS[concurrent].apply(client);
      }));
    } else {
      await pause(number);
    }
  });
}

const wakeupVehicle = async client => {
  await client.wakeup();
  await pause(6000); // give Tesla a little time to awaken
  let awake = false;
  do {
    const updatedVehicle = await client.vehicle();
    awake = updatedVehicle.response.state === 'online';
    if(!awake) {
      await pause(1000);
    }
  } while (!awake);
};

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

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
      'Content-Type': 'application/json; charset=utf-8',
      'user-agent': 'nikola-dash-button'
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

  openTrunk() {
    return this.actuateTrunk('rear');
  }

  chargePortDoorOpen() {
    return this.command('charge_port_door_open');
  }

  doorLock() {
    return this.command('door_lock');
  }

  doorUnlock() {
    return this.command('door_unlock');
  }

  honkHorn() {
    return this.command('honk_horn');
  }

  wakeup() {
    return this.command('wake_up');
  }

  flashLights() {
    return this.command('flash_lights');
  }

  autoConditioningStart() {
    return this.command('auto_conditioning_start');
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

const COMMANDS = {
  AutoConditioningStart: TeslaClient.prototype.autoConditioningStart,
  OpenTrunk: TeslaClient.prototype.openTrunk,
  OpenChargingPort: TeslaClient.prototype.chargePortDoorOpen,
  FlashLights: TeslaClient.prototype.flashLights,
  HonkHorn: TeslaClient.prototype.honkHorn,
  LockDoors: TeslaClient.prototype.doorLock,
  UnlockDoors: TeslaClient.prototype.doorUnlock
};

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
    'Content-Length': postData.length,
    'user-agent': 'nikola-dash-button'
  };

  return teslaRequest({
    method: 'POST',
    path: '/oauth/token',
    headers,
    postData
  });
};
