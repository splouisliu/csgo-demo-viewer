import React, {useState, useContext} from 'react';
import { Button, Form, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function JoinRoomPage(props){
    const setRoomId = useContext(GameContext).setRoomId;
    const downloadGame = useContext(GameContext).downloadGame;
    
    const initSocket = useContext(SocketContext).initSocket;

    const history = useHistory();
    const [textValue, setTextValue] = useState("");
    const [generalStatus, setGeneralStatus] = useState("");

    function handleChange(e){
        setTextValue(e.target.value.toUpperCase(), ()=> e.target.setSelectionRange(e.target.start,e.target.end));
    }

    async function handleSubmit(e){
        e.preventDefault();
        
        // TODO: check for validity of joincode (that joincode game JSON exists on S3)
        setGeneralStatus('Downloading game, please wait.. (might take up to 30 seconds)')
        
        initSocket(textValue);
        setRoomId(textValue);
        await downloadGame(textValue);
        history.push("/watch");
    }

    return(
        <Form className="main-form" onSubmit = {handleSubmit}>
            <Form.Row className="align-items-center">
                <Col>
                    <Form.Control type="text" placeholder="Enter Room Code" value = {textValue} onChange = {handleChange}/>
                </Col>
                <Col>
                    <Button variant="join" type = "submit">Join Session</Button>
                </Col>
            </Form.Row>
            <Form.Row className='demo-row'>
                {generalStatus}
            </Form.Row>
        </Form>
    );
}

export default JoinRoomPage;