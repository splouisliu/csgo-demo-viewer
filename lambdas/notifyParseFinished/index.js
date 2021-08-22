const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION });
const apiGateway = new AWS.ApiGatewayManagementApi({endpoint: process.env.WS_URL});
const dynamoClient = new AWS.DynamoDB.DocumentClient();

async function queryConnections(roomId){
    try{
        const params = {
            TableName: 'connections',
            ExpressionAttributeValues: {
              ':roomId': roomId,
             },
            KeyConditionExpression: 'roomId = :roomId',
            ProjectionExpression: 'connectionId'
        };

        const data = await dynamoClient.query(params).promise();
        const connectionIds = data.Items.map(item => item.connectionId);
        
        return connectionIds;
    }catch(err){
        console.log("Error querying DB");
        throw(err);
    }
}

async function notifyId(connectionId){
    try{
        const params = {
            ConnectionId: connectionId,
            Data: "Parse Finished"
        };

        await apiGateway.postToConnection(params).promise();
    }catch(err){
        console.log("Error notifying ${connectionId}");
        throw(err);
    }
}

async function notifyAll(connectionIds){
    const promises = connectionIds.map(connectionId => notifyId(connectionId));
    return Promise.all(promises);
}

exports.handler = async (event) => {
    const gameKey = event.Records[0].s3.object.key;
    const roomId = gameKey.split('/').pop().slice(0, -5);

    // Query all connected clients via roomId
    console.log("Querying connections");
    const connectionIds = await queryConnections(roomId);

    // Notify these clients
    console.log(`Sending game to ${connectionIds.length} client(s)`);
    await notifyAll(connectionIds);
    
    // Response
    console.log("Complete");
    return {
        statusCode: 200,
        body: ""
    };
};
