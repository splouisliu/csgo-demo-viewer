const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const roomId = event.body.roomId;

    const params = {
        TableName : 'connections',
        Item: {
            roomId : roomId,
            connectionId : connectionId
        }
    }
    
    await dynamoClient.put(params).promise().catch(err => {
        console.log(err);
        throw(err);
    });
        

    const response = {
        statusCode: 200,
        body: {}
    };

    return response;
};
