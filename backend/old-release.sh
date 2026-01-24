#!/bin/bash
cd old-lambda/
TIMESTAMP=$(date +%s)
zip -vr ../lambda-release-old-${TIMESTAMP}.zip . -x "*.DS_Store"
cd ../
aws lambda update-function-code --function-name=kaios-gps-location-sharer-backend --zip-file=fileb://lambda-release-old-${TIMESTAMP}.zip --no-cli-pager