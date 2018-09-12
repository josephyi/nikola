# Nikola &middot;  [![Maintainability](https://api.codeclimate.com/v1/badges/5539867dfccc0e7c3887/maintainability)](https://codeclimate.com/github/josephyi/nikola/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5539867dfccc0e7c3887/test_coverage)](https://codeclimate.com/github/josephyi/nikola/test_coverage) [![Build Status](https://travis-ci.org/josephyi/nikola.svg?branch=master)](https://travis-ci.org/josephyi/nikola)
AWS Lambda that handles click events from Amazon's [AWS IoT Button](https://www.amazon.com/dp/B01KW6YCIM), a customizable version of their dash button, to send commands to a Tesla vehicle.
Watch a demo of the charging port and trunk being opened from a single click on my [Instagram](https://www.instagram.com/p/Bl2Mbp2Frzn/?utm_source=ig_web_copy_link) or [YouTube](https://www.youtube.com/watch?v=BGvC3H8xX88).

## Prerequisites
* [AWS IoT Button](https://www.amazon.com/dp/B01KW6YCIM)
* [AWS Account](https://portal.aws.amazon.com/billing/signup)
* Tesla Account
* Tesla Vehicle ID

## Set us up the button

1. [Set up your IoT Button](https://docs.aws.amazon.com/iot/latest/developerguide/configure-iot.html).
1. Clone or download repo.
1. Copy `env.yml.template` to `env.yml`
  1. Replace `YOUR_DSN_HERE` value with your IoT Button DSN.
  1. Provide `USERNAME`, `PASSWORD`, and `VEHICLE_ID` (the `id` or `id_s` value from vehicles endpoint reponse) values.
  1. Configure the click commands as you see fit.
1. [Install Node](https://nodejs.org/en/download/)
1. Install Serverless Framework, `npm i -g serverless`
1. Deploy Lambda, `sls deploy -r aws-region-code`
1. Go to IoT Button app and change to Lambda.
1. Click button and show off to friends.

## Finding Your Vehicle ID

Get an access token by making a request to the token endpoint. Copy and paste the command below and replace `YOUR_TESLA_LOGIN_EMAIL` and `YOUR_TESLA_LOGIN_PASSWORD` with your values before running the command.

```sh
curl -X POST \
  https://owner-api.teslamotors.com/oauth/token \
    -d 'grant_type=password' \
    -d 'client_id=81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384' \
    -d 'client_secret=c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3' \
    -d 'email=YOUR_TESLA_LOGIN_EMAIL&password=YOUR_TESLA_LOGIN_PASSWORD'
```
A successful response looks something like this.

```json
{
  "access_token":"8unc4ofnumb3r5a17dl3tt3r5ih0p3urn0tr36d1ngth15b1337w00tth33nd",
  "token_type":"bearer",
  "expires_in":3888000,
  "refresh_token":"8jdf9j3hd82kd02o5djs92dq8id03odkw2kdk034odkwf23ekri0356ks24tk",
  "created_at":1535859787
}
```
Use the value of the `access_token` key to make a request for all vehicles in your account. Copy and paste the command below and replace with your access token. I've used the access token from the example response above so you can see what it should look like below.
```sh
curl -X GET \
  https://owner-api.teslamotors.com/api/1/vehicles \
  -H 'Authorization: Bearer 8unc4ofnumb3r5a17dl3tt3r5ih0p3urn0tr36d1ngth15b1337w00tth33nd'
```
The response will have a key called `response` whose value is an array of vehicles.
```json
{
  "response": [
    {
      "id": 70987654321234567,
      "vehicle_id": 1430999717,
      "vin": "5YJ3E1A2B3C4D5E6F",
      "display_name": "null",
      "option_codes": "AD15,MDL3,PBSB,RENA,BT37,ID3W,RF3G,S3PB,DRLH,DV2W,W39B,APF0,COUS,BC3B,CH07,PC30,FC3P,FG31,GLFR,HL31,HM31,IL31,LTPB,MR31,FM3B,RS3H,SA3P,STCP,SC04,SU3C,T3CA,TW00,TM00,UT3P,WR00,AU3P,APH3,AF00,ZCST,MI00,CDM0",
      "color": null,
      "tokens": [
        "5282a1b2c3d45e6f",
        "7f09a1b2c3d45e6f"
      ],
      "state": "online",
      "in_service": false,
      "id_s": "70987654321234567",
      "calendar_enabled": true,
      "backseat_token": null,
      "backseat_token_updated_at": null
    }
  ],
  "count": 1
}
```
You will need the value from the `id` or `id_s` field to set the `VEHICLE_ID` in the env.yml configuration file. Hint: To tell which vehicle is which, look at the `option_codes` and look for `MDL3`, `MDLS`, or `MDLX` for the Model 3, Model S, and Model X, respectively.

## Design Philosophy (or lack thereof)
I took the approach of less is more:

* __Single Source File__
  * editable directly in AWS console.
* __No Dependencies__
  * secure by nature of smaller attack surface area.
  * faster deployment and runtime execution.
* __Vehicle ID Required__
  * saves the hassle of having to fetch it at runtime.
