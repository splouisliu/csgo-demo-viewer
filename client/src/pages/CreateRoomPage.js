import React, {useState, useContext, useEffect} from 'react';
import { Button, Container, Form, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CreateRoomPage.css';
import {useHistory} from 'react-router-dom';
import axios from "axios";
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

const wsURL = "wss://5recwfvlb2.execute-api.us-east-2.amazonaws.com/production";
const presignedURL = "https://7jo5n6158f.execute-api.us-east-2.amazonaws.com/default/getPresignedURL";

function CreateRoomPage(props){
    const setJoinCode = useContext(GameContext).setJoinCode;
    const setGame = useContext(GameContext).setGame;
    const socket = useContext(SocketContext);
    const history = useHistory();
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("Choose Demo to Upload...");
    const [fileStatus, setFileStatus] = useState(0);
    const [fileStatusName, setFileStatusName] = useState("");
    const [submitBtnStatus, setSubmitBtnStatus] = useState(false);

    async function uploadDemo(){
        try{
            // Obtain a presigned URL
            const res = await axios.get(presignedURL, {
                params: {
                    action: 'upload'
                }
            });

            // Upload demo to S3
            await axios.put(res.data.uploadURL, file, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });

            return res.data.roomId;

        }catch(err){
            alert("Unable to upload demo");
            throw(err);
        }
    }

    async function downloadGame(roomId){
        try{
            // Obtain a presigned URL
            const res = await axios.get(presignedURL, {
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

            return payload.data;

        }catch(err){
            alert("Unable to download game");
            throw(err);
        }
    }

    function handleFile(e){
        const file = e.target.files[0];

        if(!file){
            setFileStatusName("No file selected");
            setFileStatus(-1);
            return;
        }

        else if(!file.name.match(/\.(dem)$/)){
            setFileStatusName("Invalid file format");
            setFileStatus(-1);
            setFileName(file.name);
            return;
        }

        else if(file.size > 419430400){
            setFileStatusName("File size too big");
            setFileStatus(-1);
            setFileName(file.name);
            return;
        }
        else{
            setFileStatus(1);
            setFileName(file.name);
            setFile(file);
            setSubmitBtnStatus(true);
        }
    }

    async function handleSubmit(e){
        if (fileStatus != 1)
            return;
        
        e.preventDefault();
        setSubmitBtnStatus(false);

        // Upload demo
        const roomId = await uploadDemo();
        setJoinCode(roomId);

        // Make Websocket connection
        const ws = new WebSocket(wsURL);

        ws.onopen = function(event){
            ws.send(JSON.stringify({
                action: "joinRoom",
                data: {
                    roomId: roomId
                }
            }));

            alert("Connected");
        }

        ws.onmessage = function(event){
            const game = downloadGame(roomId);
            setGame(game);
            history.push("/watch");
        }

        
    }

    return(
        <Form className = "main-modal" onSubmit={handleSubmit}>
            <Form.Row>
                <Col>
                    <Form.File id="formcheck-api-custom" custom> 
                        <Form.File.Input isValid = {fileStatus > 0} isInvalid = {fileStatus < 0} onChange ={handleFile}/>
                        <Form.File.Label data-browse="Browse">
                            {fileName}
                        </Form.File.Label>
                        <Form.Control.Feedback type="invalid">{fileStatusName}</Form.Control.Feedback>
                    </Form.File>
                    
                </Col>
                <Col>   
                    <Button variant="create" type = "submit" disabled = {!submitBtnStatus}>Create Session</Button>
                </Col>
            </Form.Row>
        </Form>
    );
}

export default CreateRoomPage;