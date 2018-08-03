const https = jest.genMockFromModule('https');
const qs = require('querystring');

const response = (options) => {
    const {body, statusCode} = options;
    return {
        statusCode,
        on: (event, callback) => {
            if (event === 'data') {
                callback(body);
            }   
        }
    };
};

https.request = (options, callback) => {
    let valid = false;
    return {
        write: data => {
            const {email, password} = qs.parse(data);
            if(email === 'test' && password === 'test') {
                valid = true;
            }

        },

        on: (event, callback) => {

        },

        end: () => {
            const {
                path
            } = options;
            let body, statusCode;
            if (path === '/oauth/token') {
                if(valid) {
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
            callback(response({body, statusCode}));
        }
    };
};

module.exports = https;