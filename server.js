import express from "express";
import fileUpload from "express-fileupload";
import socket from 'socket.io';
import fs from "fs";
import demofile from "demofile";
import randomize from 'randomatic';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


// Team id (default from CSGO)
const T = 2;
const CT = 3;

// Initialize Server
const app = express();
const port = 5000;


app.use(fileUpload());
import upload from "./routes/upload.js";
app.use("/upload", upload);

let server = app.listen(port,()=>{
    console.log(`Server started on Port ${port}`);
});

const io = socket(server);

// Watch Rooms
const MAX_ROOMS = 10;
const MAX_CLIENTS_PER_ROOM = 3;

let rooms = {}; 

// Socket.io
io.on("connection", socket=>{

    socket.on("joinRoom", roomCode=>{
        if(!(roomCode in rooms))
            return socket.emit("joinResponse", {statusMsg: "Room code doesn't exist", status: false, game: {}});
        if(Object.keys(rooms[roomCode].clients).length >= MAX_CLIENTS_PER_ROOM)
            return socket.emit("joinResponse", {statusMsg: "Room is full", status: false, game: {}});

        socket.join(roomCode);
        rooms[roomCode].clients[socket.id] = socket;


        socket.emit("joinResponse", {statusMsg: "Successful", status: true, game: rooms[roomCode].game});
        console.log(rooms);

        socket.on("playbackUpdate", status=>{
            io.to(roomCode).emit("update", status);
        })
    })
})



app.post("/upload", (req, res, next)=>{
    if(Object.keys(rooms).length >= MAX_ROOMS)
        return res.status(500).json({msg: "fuck you no more rooms"});

    let rand = randomize("A0a", 10);

    req.demo.mv(`${__dirname}/uploads/${rand}`, err=>{
        if(err){
            console.log(err);
        }
    });

    console.log("Received Demo Upload");

    let game = {
        scoreT: 0,
        scoreCT: 0,
        rounds: {}
    };
    
    function getCurrentRoundNumber(teamT, teamCT){
        return teamT.score + teamCT.score + 1;
    }
    function gameStarted(){
        return Object.keys(game.rounds).length > 0;
    }

    try{
        fs.readFile(`${__dirname}/uploads/${rand}`, (err, buffer) => {
            const demoFile = new demofile.DemoFile();
            demoFile.parse(buffer);
            
            demoFile.gameEvents.on("round_start", e=>{
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
        
                // Export JSON at end of demo
                if(e > 363966){
                    let joinCode = randomize("A0", 6);
                    res.send(joinCode);
                    rooms[joinCode] = {
                        "id": joinCode,
                        "clients": {},
                        "game": game  
                    };
                    
                    console.log("Finished processing demo");
                    
                    /*
                    //for testing
                    fs.writeFile("123.txt", JSON.stringify(game), function(err) {
                        if (err) 
                            console.log(err);
                        console.log("Data exported.");
                    });
                    */
                }
            })
        });

    }catch(err){
        console.log("error");
        return res.status(500).json({msg: "Issue Processing Demo"});
    }
})



function playLoop(){
    
}