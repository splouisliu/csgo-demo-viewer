import React, {useState, useContext} from 'react';
import { Button, Form, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CreateRoomPage.css';
import {useHistory} from 'react-router-dom';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function CreateRoomPage(props){
    const initSocket = useContext(SocketContext).initSocket;
    const addMessageHandler = useContext(SocketContext).addMessageHandler;

    const uploadDemo = useContext(GameContext).uploadDemo;
    const downloadGame = useContext(GameContext).downloadGame;

    const history = useHistory();
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("Choose Demo to Upload...");
    const [fileStatus, setFileStatus] = useState(0);
    const [fileStatusName, setFileStatusName] = useState("");
    const [submitBtnStatus, setSubmitBtnStatus] = useState(false);
    const [generalStatus, setGeneralStatus] = useState("")


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
        if (fileStatus !== 1)
            return;
        
        e.preventDefault();
        setSubmitBtnStatus(false);

        setGeneralStatus("Processing, please wait.. (might take up to 3 minutes)");
   
        // Upload demo
        const roomId = await uploadDemo(file);
        
        // Initiate WebSocket connection
        initSocket(roomId);

        // Download game JSON when backend is done parsing
        const parseFinishedHandler = async (message) => {
            await downloadGame(roomId);
            history.push("/watch");
        }
        addMessageHandler("parseFinished", parseFinishedHandler);
    }

    return(
        <Form className = "main-form" onSubmit={handleSubmit}>
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
            <Form.Row>
                {generalStatus}
            </Form.Row>
        </Form>
    );
}

export default CreateRoomPage;