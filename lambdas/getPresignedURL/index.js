const randomize = require('randomatic');
const AWS = require('aws-sdk');

// Configuration
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();
const Bucket = process.env.UploadBucket;
const URL_EXPIRATION_SECONDS = 300;

// Helper functions
async function keyExists(Key){
  try{
    await s3.headObject({Bucket, Key}).promise();
    return true;
  }catch(err){
    return false;
  }
}

async function getUploadURL(event) {
  // Generate a key that does not currently exist in S3
  let roomId;
  let Key;
  
  do{
    roomId = randomize("A0", 6);
    Key = `${roomId}.dem`;
  }while(await keyExists(Key));
  
  // Get signed URL from S3
  const s3Params = {
    Bucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: 'application/octet-stream'
  };

  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);
  
  // Response
  return JSON.stringify({
    uploadURL: uploadURL,
    roomId: roomId
  });
}

// Main Lambda entry point
exports.handler = async (event) => {
  return await getUploadURL(event);
}