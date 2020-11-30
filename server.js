import express from "express";
import fileUpload from "express-fileupload";
import socket from 'socket.io';
import demofile from "demofile";
import randomize from 'randomatic';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;


// Middleware for file authentication
app.use(fileUpload());
import upload from "./routes/upload.js";
app.use("/upload", upload);


// Initialize Server
let server = app.listen(port,()=>{
    console.log(`Server started on Port ${port}`);
});


// Watch Rooms
const MAX_ROOMS = 10;
const MAX_CLIENTS_PER_ROOM = 3;
let rooms = {}; 


// Socket.io events and listeners
const io = socket(server);

io.on("connection", socket=>{
    socket.on("joinRoom", roomCode=>{
        if(!(roomCode in rooms))
            return socket.emit("joinResponse", {statusMsg: "Room code doesn't exist", status: false, game: {}});
        if(Object.keys(rooms[roomCode].clients).length >= MAX_CLIENTS_PER_ROOM)
            return socket.emit("joinResponse", {statusMsg: "Room is full", status: false, game: {}});

        socket.join(roomCode);
        rooms[roomCode].clients[socket.id] = socket;


        socket.emit("joinResponse", {statusMsg: "Successful", status: true, game: rooms[roomCode].game, joinCode: rooms[roomCode].id});
        console.log(rooms);

        socket.on("playbackUpdate", status=>{
            socket.to(roomCode).emit("update", status);
            //console.log(status);
        })
    })
})

// Parse demo into JSON
function processDemo(demo){
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
                resolve(game)
        });
    });
}

// POST request for receiving demo upload
app.post("/upload", async (req, res, next) =>{
    console.log("Received Demo Upload");
    
    if(Object.keys(rooms).length >= MAX_ROOMS)
        return res.status(500).json({msg: "fuck you no more rooms"});

    try{
        // Waits for demo parsing
        let game = await processDemo(req.demo.data);

        // After processed demo is retreived, set up room and send room code back to client
        console.log("Finished processing demo");

        let joinCode = randomize("A0", 6);
        res.send(joinCode);

        rooms[joinCode] = {
            "id": joinCode,
            "clients": {},
            "game": game,
        };

    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
});


    

/*
    //for testing
    fs.writeFile("og.txt", JSON.stringify(game), function(err) {
        if (err) 
            console.log(err);
        console.log("Data exported.");
    });
*/


