import React, {useContext, useState} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";

function HomePage(props){
    const history = useHistory();
    const setRoomId = useContext(GameContext).setRoomId;
    const setGame = useContext(GameContext).setGame;
    const initSocket = useContext(SocketContext).initSocket;

    const [generalStatus, setGeneralStatus] = useState("");
    const [demoConnecting, setDemoConnecting] = useState(false);

    const handleCreateRoom = () => history.push("/create");
    const handleJoinRoom = () => history.push("/join");
    const handleTryDemo = async () => {
        if(demoConnecting)
            return;

        const roomId = "LGP2J8";

        setGeneralStatus("Downloading game, please wait.. (might take up to 1 minute)");
        setDemoConnecting(true);
        
        initSocket(roomId);
        setRoomId(roomId);

        fetch(`./demo/${roomId}.json`)
        .then((r) => r.json())
        .then((game) => {
            setGame(game);
            history.push("/watch");
        })
    }

    return(
        <Container fluid className = "page">
            <Container>
                <Row className = "main-modal noselect">
                    <Col className = "left" onClick = {handleCreateRoom}>
                        Create Session
                    </Col>
                    <Col className = "right" onClick = {handleJoinRoom}>
                        Join Session
                    </Col>
                </Row>
                <Row id = "demo-row" className = "noselect">
                    <Col id = "demo" onClick = {handleTryDemo}>
                        Try a sample demo!
                    </Col>
                </Row>
                <Row id = "demo-row">
                    {generalStatus}
                </Row>
            </Container>
        </Container>
    )
}

export default HomePage;