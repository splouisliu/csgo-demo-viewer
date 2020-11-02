import React, {useState, useContext, useEffect} from 'react';
import { Button, Jumbotron, Container, Form, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';
import {useHistory} from 'react-router-dom';
import axios from "axios";
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";


function CreateForm(props){
    const setGame = useContext(GameContext).setGame;
    const socket = useContext(SocketContext);
    const history = useHistory();
    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("Choose Demo to Upload...");
    const [fileStatus, setFileStatus] = useState(0);
    const [fileStatusName, setFileStatusName] = useState("");
    const [submitBtnStatus, setSubmitBtnStatus] = useState(false);


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

    function handleSubmit(e){
        e.preventDefault();
        
        if(fileStatus == 1){
            setSubmitBtnStatus(false);

            const formData = new FormData();
            formData.append("file", file);

            // Uploads selected demo file
            axios.post("/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
        
            // If server is successful in processing demo, it sends back a room code/permission used to create a websocket room
            }).then(res=> {
                
                console.log(res);
                socket.emit("joinRoom", res.data);
                socket.on("joinResponse", data=>{
                    if(data.status){
                        setGame(data.game);
                        history.push("/watch");
                    }else
                        alert(data.statusMsg)
                });
            });
        }
    }



    return(
        <Form onSubmit={handleSubmit}>
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
        </Form>
    );
}

function JoinForm(props){
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

function HomePage(props){

    return(
        <Container>
            <Jumbotron id = "createSessionSection" >
                <CreateForm/>
            </Jumbotron>
            <Jumbotron id = "joinSessionSection" >
                <JoinForm/>
            </Jumbotron>    
        </Container>
    )
}

export default HomePage;
