const AWS = require('aws-sdk');
const demofile = require('demofile');

// Configuration
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();
const Bucket = process.env.UploadBucket;

// Helper Functions
function parseDemo(demo){
    return new Promise((resolve, reject) => {
        const T = 2;
        const CT = 3;

        // Game JSON to be returned
        let game = {
            scoreT: 0,
            scoreCT: 0,
            map: "",
            rounds: {}
        };

        // Helper funtions
        function getCurrentRoundNumber(teamT, teamCT){
            return teamT.score + teamCT.score + 1;
        }
        function gameStarted(){
            return Object.keys(game.rounds).length > 0;
        }

        // Run demo parsing
        const demoFile = new demofile.DemoFile();
        demoFile.parse(demo);

        game.map = demoFile.header.mapName;
        
        // Event listeners
        demoFile.gameEvents.on("round_freeze_end", e=>{
            let playersT = demoFile.teams[T].members;
            let playersCT = demoFile.teams[CT].members;
            
            if(playersT === undefined || playersT.length < 1 || playersCT === undefined || playersCT.length < 1)
                return;

            // ~~~~~~~~~~~~~~ Create New Round ~~~~~~~~~~~~~~~~~~~~~~~~~~
            
            let currentRoundNumber = getCurrentRoundNumber(demoFile.teams[T], demoFile.teams[CT]);
            let round = {
                "round_number": currentRoundNumber,
                "startTick": demoFile.currentTick,
                "endTick": null,
                "teamT": {},
                "teamCT": {},
                "player_positions": []
            }
            
            // Create list of T players
            playersT.map(current=>{
                let player = {
                    "id": current.userId,
                    "name": current.name,
                }
                round.teamT[current.userId] = player;
            })

            // Create list of CT players
            playersCT.map(current=>{
                let player = {
                    "id": current.userId,
                    "name": current.name,
                }
                round.teamCT[current.userId] = player;
            })

            game.rounds[currentRoundNumber] = round;
        })
        
        demoFile.gameEvents.on("round_end", e=>{
            if(!gameStarted() || game.rounds[Object.keys(game.rounds).length] == null)
                return;

            game.rounds[Object.keys(game.rounds).length].endTick = demoFile.currentTick;

            if(e.winner == T)
                game.scoreT++;
            else if(e.winner == CT)
                game.scoreCT++;
        });


        demoFile.on("tickend", e=>{
            if(!gameStarted() || game.rounds[Object.keys(game.rounds).length] == null)
                return;

            let playersT = demoFile.teams[T].members;
            let playersCT = demoFile.teams[CT].members;

            let currentRound = game.rounds[Object.keys(game.rounds).length];

            let pos = {
                tick: demoFile.currentTick,
                players: {}
            };

            playersT.map(current=>{
                if(current.userId in currentRound.teamT){
                    pos.players[current.userId] = {
                        id: current.userId,
                        position: current.isAlive ? {
                            x: current.position.x,
                            y: current.position.y} : null 
                    }
                }
            });

            playersCT.map(current=>{
                if(current.userId in currentRound.teamCT){
                    pos.players[current.userId] = {
                        id: current.userId,
                        position: current.isAlive ? {
                            x: current.position.x,
                            y: current.position.y} : null 
                    }
                }
            });

            currentRound.player_positions.push(pos);
        })

        // Resolves promise once demo has finished parsing
        demoFile.on("end", ()=> {
            demoFile.cancel();
            if(Object.keys(game.rounds).length < 1)
                reject("Error parsing demo");
            else
                resolve(game);
        });
    });
}

async function downloadDemo(Key){
    try{
        const object = await s3.getObject({Bucket, Key}).promise();
        return object.Body;
    }catch(err){
        console.log("Error downloading demo");
        throw(err);
    }
}

async function uploadGame(Key, game){
    try{
        const params = {
            Bucket,
            Key,
            Body: JSON.stringify(game),
            ContentType: "application/json"
        }
        await s3.upload(params).promise();
    }catch(err){
        console.log("Error uploading game JSON");
        throw err;
    }
}

async function deleteDemo(Key){
    try{
        await s3.deleteObject({Bucket, Key}).promise();
    }catch(err){
        console.log("Error deleting demo");
        throw err;
    }
}

exports.handler = async (event) => {
    const demoKey = event.Records[0].s3.object.key;
    const gameKey = `games/${demoKey.slice(0, -4)}.json`;
    
    // Download demo
    console.log(`Downloading demo: ${demoKey}`);
    const demo = await downloadDemo(demoKey);

    // Parse demo
    console.log(`Parsing demo`);
    const game = await parseDemo(demo);
 
    // Upload game JSON to S3
    console.log("Uploading game JSON");
    await uploadGame(gameKey, game);
    
    // Delete demo from S3
    console.log("Deleting demo");
    await deleteDemo(demoKey);

    // Response
    console.log("Complete");

    return {
        statusCode: 200,
        body: {}
    };
};