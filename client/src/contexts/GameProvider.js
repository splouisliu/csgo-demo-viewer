import React, {useState, useRef} from 'react';
import axios from "axios";

const PRESIGNED_URL = "https://7jo5n6158f.execute-api.us-east-2.amazonaws.com/default/getPresignedURL";

export const GameContext = React.createContext();

export function GameProvider(props){
    const [game, setGame] = useState(null);
    const [roomId, setRoomId] = useState("");

    async function uploadDemo(demo){
        try{
            // Obtain a presigned URL
            const res = await axios.get(PRESIGNED_URL, {
                params: {
                    action: 'upload'
                }
            });

            // Upload demo to S3
            await axios.put(res.data.uploadURL, demo, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });

            setRoomId(res.data.roomId);
            return(res.data.roomId);

        }catch(err){
            alert("Unable to upload demo");
            throw(err);
        }
    }

    async function downloadGame(roomId){
        try{
            // Obtain a presigned URL
            const res = await axios.get(PRESIGNED_URL, {
                params: {
                    action: 'download',
                    roomId: roomId
                }
            });

            // Download game JSON from S3
            const payload = await axios.get(res.data.downloadURL, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setGame(payload.data);
            return payload.data;

        }catch(err){
            alert("Unable to download game");
            throw(err);
        }
    }

    return(
        <GameContext.Provider value={{game, roomId, setRoomId, uploadDemo, downloadGame}}>
            {props.children}
        </GameContext.Provider>
    );
}