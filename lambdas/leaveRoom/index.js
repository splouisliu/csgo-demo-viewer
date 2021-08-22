const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION });
const apiGateway = new AWS.ApiGatewayManagementApi({endpoint: process.env.WS_URL});
const dynamoClient = new AWS.DynamoDB.DocumentClient();

async function deleteConnection(connectionId){
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
        const roomId = data.Items[0].roomId;
        
        // Delete connection
        const deleteParams = {
            TableName: 'connections',
            Key: {
                roomId: roomId,
                connectionId: connectionId
            }
        };
  
        await dynamoClient.delete(deleteParams).promise();
        
    }catch(err){
        console.log("Error deleting connection");
        throw(err);
    }
}

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    
    console.log("Connection ID: ", connectionId);

    await deleteConnection(connectionId);

    // Response
    console.log("Complete");
    return {
        statusCode: 200,
        body: ""
    };
};
