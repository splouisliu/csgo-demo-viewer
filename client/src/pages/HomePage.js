import React from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';


function HomePage(props){
    const history = useHistory();

    const handleCreateRoom = () => history.push("/create")
    const handleJoinRoom = () => history.push("/join")

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
            </Container>
        </Container>
    )
}

export default HomePage;