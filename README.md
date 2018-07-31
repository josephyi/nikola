# Nikola
AWS Lambda that handles click events from Amazon's [AWS IoT Button](https://www.amazon.com/dp/B01KW6YCIM), a customizable version of their dash button, to send commands to a Tesla vehicle.
Watch a demo of the charging port and trunk being opened from a single click on my [Instagram](https://www.instagram.com/p/Bl2Mbp2Frzn/?utm_source=ig_web_copy_link) or [YouTube](https://www.youtube.com/watch?v=BGvC3H8xX88).

## Prerequisites
* [AWS IoT Button](https://www.amazon.com/dp/B01KW6YCIM)
* [AWS Account](https://portal.aws.amazon.com/billing/signup)
* Tesla Account
* Tesla Vehicle ID (TODO: instructions)

## Installation

1. [Set up your IoT Button](https://docs.aws.amazon.com/iot/latest/developerguide/configure-iot.html).
1. Clone or download repo.
1. Copy `env.yml.template` to `env.yml`
1. Replace `YOUR_DSN_HERE` value with your IoT Button DSN.
1. Provide `USERNAME`, `PASSWORD`, and `VEHICLE_ID` values.
1. [Install Node](https://nodejs.org/en/download/)
1. Install Serverless Framework, `npm i -g serverless`
1. Deploy Lambda, `sls deploy -r aws-region-code`
1. Go to IoT Button app and change to Lambda.
1. Click button and show off to friends.

## Design Philosophy (or lack thereof)
I took the approach of less is more:

* __Single Source File__
  * editable directly in AWS console.
* __No Dependencies__
  * secure by nature of smaller attack surface area.
  * faster deployment and runtime execution.
* __Vehicle ID Required__
  * saves the hassle of having to fetch it at runtime.
