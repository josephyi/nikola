const https = jest.genMockFromModule('https');
const qs = require('querystring');

const response = (options) => {
    const {
        body,
        statusCode
    } = options;
    return {
        statusCode,
        on: (event, callback) => {
            if (event === 'data') {
                callback(body);
            }

            if (event === 'end') {
                callback();
            }
        },
    };
};

valid = false;
asleep = true;
https.request = (options, callback) => {
    return {
        write: data => {
            const {
                email,
                password
            } = qs.parse(data);
            if (email === 'test' && password === 'test') {
                valid = true;
            }

        },

        on: (event, callback) => {

        },

        end: () => {
            const {
                path
            } = options;
            let body = '{}';
            let statusCode = 200;
            if (path === '/oauth/token') {
                if (valid) {
                    body = `{
                    "access_token": "abc123",
                    "token_type": "bearer",
                    "expires_in": 7776000,
                    "created_at": 1457385291,
                    "refresh_token": "cba321"
                  }`;

                    statusCode = 200;
                } else {
                    body = `{}`;
                    statusCode = 401;
                }
            }

            if (path === `/api/1/vehicles/abc`) {
                if (asleep) {

                    body = `{
                        "response": {
                           "state": "asleep"
                        }
                    }`;

                } else {
                    body = `{
                    "response": {
                       "state": "online"
                    }
                }`;

                }
                statusCode = 200;
            }

            if (path === `/api/1/vehicles/abc/command/wake_up`) {
                asleep = false;
                body = `{"response" : {}}`;
            }

            callback(response({
                body,
                statusCode
            }));

            if (path === `/oauth/revoke`) {
                valid = false;
                asleep = true;
            }
        }
    };
};

module.exports = https;