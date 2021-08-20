const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION });
const URL = "https://5recwfvlb2.execute-api.us-east-2.amazonaws.com/production";
const apiGateway = new AWS.ApiGatewayManagementApi({endpoint: URL});
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const Bucket = process.env.UploadBucket;

async function downloadGame(Key){
    try{
        const object = await s3.getObject({Bucket, Key}).promise();
        return object.Body;
    }catch(err){
        console.log("Error downloading demo");
        throw(err);
    }
}

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

async function sendGameToOne(connectionId, game){
    try{
        const params = {
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(game))
        };

        await apiGateway.postToConnection(params).promise();
    }catch(err){
        console.log("Error sending game to ${connectionId}");
        throw(err);
    }
}

async function sendGameToAll(connectionIds, game){
    const promises = connectionIds.map(connectionId => {
        sendGameToOne(connectionId, game);
    });

    return Promise.all(promises);
}

exports.handler = async (event) => {
    const gameKey = event.Records[0].s3.object.key;
    const roomId = gameKey.split('/').pop().slice(0, -5);

    // Get game JSON from s3
    console.log("Downloading game: ", gameKey);
    const game = await downloadGame(gameKey);

    // Query all connected clients via roomId
    console.log("Querying connections");
    const connectionIds = await queryConnections(roomId);

    // Send game JSON to these clients
    console.log(`Sending game to ${connectionIds.length} client(s)`);
    await sendGameToAll(connectionIds, game);
    
    // Response
    console.log("Complete");
    return {
        statusCode: 200,
        body: {}
    };
};
