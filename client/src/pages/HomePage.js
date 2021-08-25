import React, {useContext, useState} from 'react';
import {Container, Row, Spinner, Button, ButtonGroup} from 'react-bootstrap';
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

    const [processing, setProcessing] = useState(false);

    const handleCreateRoom = () => history.push("/create");
    const handleJoinRoom = () => history.push("/join");
    const handleTryDemo = async () => {
        const roomId = "LGP2J8";

        initSocket(roomId);
        setRoomId(roomId);
        setProcessing(true);

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
                <Row className = "main-modal">
                    <ButtonGroup>
                        <Button id = "btn-create" variant = "custom" onClick = {handleCreateRoom}>
                            Create Session
                        </Button>
                        <Button id = "btn-join" variant = "custom" onClick = {handleJoinRoom}>
                            Join Session
                        </Button>
                    </ButtonGroup>
                </Row>
                <Row className>
                    <Button id = "btn-demo" variant = "custom" onClick = {handleTryDemo} disabled = {processing}>
                        {processing
                            ? <Spinner as="span" animation="border" role="status"/>
                            : "Try a sample demo!"
                        }
                    </Button>
                </Row>
            </Container>
        </Container>
    )
}

export default HomePage;