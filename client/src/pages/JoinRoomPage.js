import React, {useState, useContext, useEffect} from 'react';
import { Button, Jumbotron, Container, Form, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import axios from "axios";
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function JoinRoomPage(props){
    const setRoomId = useContext(GameContext).setRoomId;
    const downloadGame = useContext(GameContext).downloadGame;
    
    const initSocket = useContext(SocketContext).initSocket;
    const addMessageHandler = useContext(SocketContext).addMessageHandler;
    const emitMessage = useContext(SocketContext).emitMessage;

    const history = useHistory();
    const [textValue, setTextValue] = useState("");

    function handleChange(e){
        setTextValue(e.target.value.toUpperCase(), ()=> e.target.setSelectionRange(e.target.start,e.target.end));
    }

    async function handleSubmit(e){
        e.preventDefault();
        
        // TODO: check for validity of joincode (that joincode game JSON exists on S3)
        
        initSocket(textValue);
        setRoomId(textValue);
        await downloadGame(textValue);
        history.push("/watch");
    }

    return(
        <Form onSubmit = {handleSubmit}>
            <Form.Row className="align-items-center">
                <Col>
                    <Form.Control type="text" placeholder="Enter Join Code" value = {textValue} onChange = {handleChange}/>
                </Col>
                <Col>
                    <Button variant="join" type = "submit">Join Session</Button>
                </Col>
            </Form.Row>
        </Form>
    );
}

export default JoinRoomPage;