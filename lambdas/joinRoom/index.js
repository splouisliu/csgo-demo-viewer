const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();

async function addConnection(roomId, connectionId){
    const params = {
        TableName : 'connections',
        Item: {
            roomId : roomId,
            connectionId : connectionId
        }
    };
    
    await dynamoClient.put(params).promise().catch(err => {
        console.log("Error adding connection");
        throw(err);
    });
}

exports.handler = async (event) => {
    const data = JSON.parse(event.body).data;
    const roomId = data.roomId;
    const connectionId = event.requestContext.connectionId;
    
    console.log("Room ID: ", roomId);
    console.log("Connection ID: ", connectionId);

    await addConnection(roomId, connectionId);
    
    // Response
    console.log("Complete");
    return {
        statusCode: 200,
        body: ""
    };
};