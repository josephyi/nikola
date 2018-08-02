const https = jest.genMockFromModule('https');

class FakeRequest {
    constructor() {

    }

    write(data) {

    }

    on(str, callback) {

    }

    end() {

    }
}

function request(options, callback) {
    return new FakeRequest();
}

https.request = request;


module.exports = https;