import React, {useState, useContext} from 'react';
import { Button, Form, Col, Spinner} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './JoinRoomPage.css';
import {useHistory} from 'react-router-dom';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function JoinRoomPage(props){
    const setRoomId = useContext(GameContext).setRoomId;
    const downloadGame = useContext(GameContext).downloadGame;
    
    const initSocket = useContext(SocketContext).initSocket;
    const closeSocket = useContext(SocketContext).closeSocket;

    const history = useHistory();
    const [textValue, setTextValue] = useState("");
    const [processing, setProcessing] = useState(false);

    function handleChange(e){
        setTextValue(e.target.value.toUpperCase(), ()=> e.target.setSelectionRange(e.target.start,e.target.end));
    }

    function handleSubmit(e){
        e.preventDefault();
        
        // TODO: check for validity of joincode (that joincode game JSON exists on S3)
        initSocket(textValue);
        setRoomId(textValue);
        setProcessing(true);

        downloadGame(textValue).then(data=>{
            history.push("/watch");
        }).catch(err => {
            closeSocket();
            setProcessing(false);
        });
    }

    return(
        <Form className="main-form" onSubmit = {handleSubmit}>
            <Form.Row className="align-items-center">
                <Col>
                    <Form.Control type="text" placeholder="Enter Room Code" value = {textValue} onChange = {handleChange}/>
                </Col>
                <Col>
                    <Button type = "submit">
                        {processing
                            ? <Spinner as="span" animation="border" role="status" size="sm"/>
                            : "Join Session"
                        }
                    </Button>
                </Col>
            </Form.Row>
            <Form.Row className='demo-row'>
                {processing && 
                    <p>Downloading game.. (expect 1 minute)</p>
                }
            </Form.Row>
        </Form>
    );
}

export default JoinRoomPage;