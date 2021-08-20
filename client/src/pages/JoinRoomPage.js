import React, {useState, useContext, useEffect} from 'react';
import { Button, Jumbotron, Container, Form, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import axios from "axios";
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";


function JoinRoomPage(props){
    const setJoinCode = useContext(GameContext).setJoinCode;
    const setGame = useContext(GameContext).setGame;
    const socket = useContext(SocketContext);
    const history = useHistory();
    const [textValue, setTextValue] = useState("");

    function handleChange(e){
        setTextValue(e.target.value.toUpperCase(), ()=> e.target.setSelectionRange(e.target.start,e.target.end));
    }

    function handleSubmit(e){
        e.preventDefault();
        
        // ADD: check for validity of joincode
        //

        socket.emit("joinRoom", textValue);
    }

    useEffect(()=>{
        socket.on("joinResponse", (data)=>{
            if(data.status == false)
                alert(data.statusMsg);
            else{
                setGame(data.game);
                setJoinCode(data.joinCode);
                history.push("/watch");
            }
        })
    },[]);

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