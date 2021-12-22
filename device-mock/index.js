const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const queueUrl = "https://sqs.us-east-1.amazonaws.com/069968953470/smart-parking-queue";

let sqsOrderData = {
    MessageBody: JSON.stringify({
        parking_id: 1,
        parking_slot_id: 1,
        is_busy: process.argv[2]
    }),
    QueueUrl: queueUrl
};

let sendSqsMessage = sqs.sendMessage(sqsOrderData).promise();

sendSqsMessage.then((data) => {
    console.log(`SUCCESS: ${data.MessageId}`);
}).catch((err) => {
    console.log(`ERROR: ${err}`);
});
