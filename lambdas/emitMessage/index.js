const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION });
const apiGateway = new AWS.ApiGatewayManagementApi({endpoint: process.env.WS_URL});
const dynamoClient = new AWS.DynamoDB.DocumentClient();

async function getRoomId(connectionId){
    try{
        // Query for roomId
        const queryParams = {
            TableName: 'connections',
            IndexName: 'connectionId-index',
            ExpressionAttributeValues: {
              ':connectionId': connectionId,
             },
            KeyConditionExpression: 'connectionId = :connectionId',
            ProjectionExpression: 'roomId'
        };
    
        const data = await dynamoClient.query(queryParams).promise();
        
        return data.Items[0].roomId;
    }catch(err){
        console.log("Error finding roomId");
        throw(err);
    }
}

async function queryConnections(roomId, connectionIdToRemove){
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
        
        const connectionIds = data.Items.reduce((result, item) => {
            if(item.connectionId !== connectionIdToRemove)
                result.push(item.connectionId);
            
            return result;
        }, []);
        
        return connectionIds;
    }catch(err){
        console.log("Error querying DB");
        throw(err);
    }
}

async function sendMessage(connectionIds, eventName, message){
    try{
        await Promise.all(connectionIds.map(async (connectionId) => {
            const params = {
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify({
                    eventName: eventName,
                    message: message
                }))
            };

            await apiGateway.postToConnection(params).promise();
        }));
    }catch(err){
        console.log("Error sending message");
        throw(err);
    }
}

exports.handler = async (event) => {
    const data = JSON.parse(event.body).data;
    const eventName = data.eventName;
    const message = data.message;
    const connectionId = event.requestContext.connectionId;
    
    // Query for all other connections in the same room
    const roomId = await getRoomId(connectionId);
    const connectionIds = await queryConnections(roomId, connectionId);
    
    // Send message
    await sendMessage(connectionIds, eventName, message);
    
    return {
        statusCode: 200,
        body: ""
    };
};