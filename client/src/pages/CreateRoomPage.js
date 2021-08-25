import React, {useState, useContext} from 'react';
import { Button, Form, Row, Col, Spinner} from 'react-bootstrap';
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

    const MAX_DEMO_SIZE = 400;  // in MB

    const statuses = {
        nofile: 1,
        invalidFormat: 2,
        sizeTooBig: 3,
        staged: 4,
        processing: 5
    };

    const statusMsgs = {
        1: "No file selected",
        2: "Invalid file format",
        3: `File size exceeds max limit of ${MAX_DEMO_SIZE} MB`,
        4: "Ready to go!",
        5: "Processing demo.. (expect 2-4 minutes)"
    }

    const history = useHistory();
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("Choose Demo to Upload...");
    const [status, setStatus] = useState(statuses.noFile);

    // File verification
    function handleFile(e){
        const file = e.target.files[0];

        if(!file){
            setStatus(statuses.noFile);
        }else if(!file.name.match(/\.(dem)$/)){
            setStatus(statuses.invalidFormat);
            setFileName(file.name);
        }else if(file.size > MAX_DEMO_SIZE *(1024**2)){
            setStatus(statuses.sizeTooBig);
            setFileName(file.name);
        }else{
            setStatus(statuses.staged);
            setFileName(file.name);
            setFile(file);
        }
    }

    async function handleSubmit(e){
        if (status !== statuses.staged)
            return;
        e.preventDefault();

        setStatus(statuses.processing);

        // Upload demo
        let roomId;
        try{
            roomId = await uploadDemo(file);
        }catch(err){
            setStatus(statuses.noFile);
            return;
        }

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
            <Row>
                <Col>
                    <Form.File custom> 
                        <Form.File.Input 
                            isValid = {status >= statuses.staged} 
                            isInvalid = {status < statuses.staged}
                            disabled={status === statuses.processing} 
                            onChange ={handleFile} 
                        />
                        <Form.File.Label data-browse="Browse">
                            {fileName}
                        </Form.File.Label>
                        <Form.Control.Feedback type="invalid">{statusMsgs[status]}</Form.Control.Feedback>
                        <Form.Control.Feedback type="valid">{statusMsgs[status]}</Form.Control.Feedback>
                    </Form.File>
                </Col>
                <Col>   
                    <Button type = "submit" disabled = {status !== statuses.staged}>
                        {status === statuses.processing
                            ? <Spinner as="span" animation="border" role="status" size="sm"/>
                            : "Create Session"
                        }
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

export default CreateRoomPage;