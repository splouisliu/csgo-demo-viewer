import React, {useContext} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function HomePage(props){
    const history = useHistory();
    const setRoomId = useContext(GameContext).setRoomId;
    const downloadGame = useContext(GameContext).downloadGame;
    const initSocket = useContext(SocketContext).initSocket;

    const handleCreateRoom = () => history.push("/create");
    const handleJoinRoom = () => history.push("/join");
    const handleTryDemo = async () => {
        const roomId = "EBMBTX";

        alert("Downloading game..");

        initSocket(roomId);
        setRoomId(roomId);
        await downloadGame(roomId);
        history.push("/watch");
    }

    return(
        <Container fluid className = "page">
            <Container>
                <Row className = "main-modal">
                    <Col className = "left" onClick = {handleCreateRoom}>
                        Create Session
                    </Col>
                    <Col className = "right" onClick = {handleJoinRoom}>
                        Join Session
                    </Col>
                </Row>
                <Row id = "demo-row">
                    <Col id = "demo" onClick = {handleTryDemo}>
                        Try a Demo!
                    </Col>
                </Row>
            </Container>
        </Container>
    )
}

export default HomePage;