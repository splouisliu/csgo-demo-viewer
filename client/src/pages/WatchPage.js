import React, { useEffect, useRef, useState, useContext } from 'react';
import { Container, Pagination, Button, ButtonGroup, Alert, ToggleButton, ButtonToolbar, ToggleButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './WatchPage.css';
import { SocketContext } from "../contexts/SocketProvider";
import { GameContext } from "../contexts/GameProvider";
import { useInterval, useWindowDimensions, mapInfo } from "../helpers/Helpers";
import { Stage, Layer, Line, Circle, Rect } from 'react-konva';
import useImage from 'use-image';

//import gameFile from "../mygame_new.json";

const DEFAULT_MAP_SIDE_LENGTH = 1024;

function MapLayer(props){
    const [image] = useImage(`./maps/${props.map}.png`);

    return (
        <Layer>
            <Rect
                width={props.sideLength}
                height={props.sideLength}
                fillPatternImage={image}
                fillPatternScaleY={props.sideLength / DEFAULT_MAP_SIDE_LENGTH}
                fillPatternScaleX={props.sideLength / DEFAULT_MAP_SIDE_LENGTH}
                opacity={0.9}
            >
            </Rect>
        </Layer>
    )
}

function PlaybackLayer(props){
    const calibratePosition = (x, y) => {
        const info = mapInfo[props.map];
        const k = props.sideLength / DEFAULT_MAP_SIDE_LENGTH;

        x = (x-info.x0)*k/info.scale;
        y = (info.y0-y)*k/info.scale;

        return [x, y];
    }

    const isTerrorist = (playerId) => {
        return playerId in props.rounds[props.currentRound].teamT;
    }

    return (
        <Layer>
            {props.playerPositions.map(position => {
                const [x, y] = calibratePosition(position.x, position.y);
                return(
                    <Circle 
                        x={x} 
                        y={y} 
                        radius={6} 
                        fill={isTerrorist(position.id) ? '#EDE67F' : '#78A8CA'}
                    />
                );
            })}
            <Rect
                width={props.sideLength}
                height={props.sideLength}
            >
            </Rect>
        </Layer>
    )
}

function CanvasLayer(props){
    const emitMessage = useContext(SocketContext).emitMessage;
    const addMessageHandler = useContext(SocketContext).addMessageHandler;
    const isDrawing = useRef(false);
    
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        props.setLines([...props.lines, { tool: props.currentTool, points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) 
            return;
        
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        
        let lastLine = props.lines[props.lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        props.lines.splice(props.lines.length - 1, 1, lastLine);
        props.setLines(props.lines.concat());

        // Emit to Websocket
        emitMessage("canvasUpdate", {lines: props.lines});
    };

    const setDrawingState = (state) => {
        isDrawing.current = state;
    };

    useEffect(()=>{
        const canvasUpdateHandler = (message) => {
            props.setLines(message.lines);
        }
        addMessageHandler("canvasUpdate", canvasUpdateHandler);
    }, []);

    return(
        <Layer listening={props.currentTool !== 'mouse'}>
            {props.lines.map((line, i) => (
                <Line
                    key={i}
                    points={line.points}
                    stroke="#df4b26"
                    strokeWidth={
                        line.tool === 'eraser' ? 30 : 5
                    }
                    tension={0.5}
                    lineCap="round"
                    globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                />
            ))}
            <Rect
                width={props.sideLength}
                height={props.sideLength}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setDrawingState(false)}
                onMouseLeave={() => setDrawingState(false)}
            >
            </Rect>
        </Layer>
    )
}

function MainStage(props){
    const sideLength = useWindowDimensions().height*0.8;

    return (
        <SocketContext.Consumer>
            {value => (
                <p align='center'>
                    <Stage width={sideLength} height={sideLength}>
                        <SocketContext.Provider value={value}>
                            <MapLayer sideLength={sideLength} map={props.game.map}/>
                            <PlaybackLayer 
                                sideLength={sideLength} 
                                playerPositions={props.playerPositions} 
                                map={props.game.map} 
                                currentRound={props.currentRound}
                                rounds={props.game.rounds}
                            />
                            <CanvasLayer 
                                sideLength={sideLength}
                                currentTool={props.currentTool}
                                lines={props.lines}
                                setLines={props.setLines}
                            />
                        </SocketContext.Provider>
                    </Stage>
                </p>
            )}
        </SocketContext.Consumer>
    );
}

function RoundPagination(props){
    const [active, setActive] = useState(props.currentRound);
    let items = [];

    function changeSelected(i){
        setActive(i);
        props.changeRound(i);
    }

    useEffect(()=>{
        setActive(props.currentRound);
    },[props.currentRound]);

    // Displaying pagination numbers
    for (let number = 1; number <= props.maxRound; number++) {
        items.push(
            <Pagination.Item key={number} active={number === active} onClick={() => changeSelected(number)}>
                {number}
            </Pagination.Item>,
        );
    }

    return(
        <Pagination>{items}</Pagination>
    );
};

function Toolbar(props){
    const tools = ['mouse', 'pencil', 'eraser'];
    
    return (
        <ButtonToolbar id="toolbar">
            <ToggleButtonGroup type="radio" name="radio" defaultValue={props.currentTool}>
                {tools.map((toolName) => (
                    <ToggleButton 
                        variant="outline-secondary" 
                        name="radio" 
                        value={toolName}
                        checked={toolName === props.currentTool}
                        onChange={(e) => props.setCurrentTool(e.currentTarget.value)}
                    >
                        {<img src={`/icons/${toolName}.png`} alt={toolName}/>}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            &nbsp;&nbsp;
            <ButtonGroup>
                <Button variant="outline-secondary" onClick={props.clearCanvas}>
                    <img src={"/icons/delete.png"} alt="delete"/>
                </Button>
            </ButtonGroup>
        </ButtonToolbar>
    );
};


function Game(props){
    const game = useContext(GameContext).game;
    const roomId = useContext(GameContext).roomId;
    const emitMessage = useContext(SocketContext).emitMessage;
    const addMessageHandler = useContext(SocketContext).addMessageHandler;

    const [playerPositions, setPlayerPositions] = useState([]);
    const [playbackState, setPlaybackState] = useState({
        currentRound: 1,
        t: 0,
        paused: true
    });
    const [currentTool, setCurrentTool] = useState('mouse');
    const [lines, setLines] = React.useState([]);

    function clearCanvas(){
        setLines([])

        // Emit to Websocket
        emitMessage("canvasUpdate", {lines: []});
    }

    function updatePlayerPositions(round, t){
        if(game.rounds[round] == null)
            return;
            
        let players = game.rounds[round].player_positions[t].players;
        let positions = [];
        
        for(const player of Object.values(players)){
            // Skips if player is dead
            if(player.position == null)
                continue;

            positions.push({
                id: player.id,
                x: player.position.x,
                y: player.position.y
            });
        }

        setPlayerPositions(positions);
    }

    function changeRound(i){
        // Set initial player positions
        updatePlayerPositions(i, 0);

        // Set playback state
        let newState = {currentRound: i, t:0, paused: true};
        setPlaybackState(newState);
        
        // Emit playback state to websocket
        emitMessage("playbackUpdate", {state: newState});
    }

    function pauseUnpause(){
        let newState = {currentRound: playbackState.currentRound, t:playbackState.t, paused: playbackState.paused ? false: true};
        setPlaybackState(newState);

        emitMessage("playbackUpdate", {state: newState});
    }
    
    useInterval(()=>{
        if(game != null && !playbackState.paused && game.rounds[playbackState.currentRound] != null 
            && playbackState.t < game.rounds[playbackState.currentRound].player_positions.length){
                
            updatePlayerPositions(playbackState.currentRound, playbackState.t);
            setPlaybackState({currentRound: playbackState.currentRound, t: playbackState.t+1, paused: playbackState.paused});
        }
    }, 12);
     
    useEffect(()=>{
        // Initial Player positions
        if(game != null)
            updatePlayerPositions(playbackState.currentRound, 0);

        // Socket listener
        const playbackUpdateHandler = (message) => {
            const state = message.state;
            setPlaybackState(state);

            if(game != null)
                updatePlayerPositions(state.currentRound, state.t);
        }
        addMessageHandler("playbackUpdate", playbackUpdateHandler);
    },[]);

    if(game == null){
        return(
            <Container>No Game Loaded!</Container>
        );
    }
    return(
        <Container>
            <Alert id="alert" variant="primary">
                Room Code: {roomId}
            </Alert>
            <MainStage
                playerPositions = {playerPositions}
                currentRound = {playbackState.currentRound}
                currentTool = {currentTool}
                lines = {lines}
                setLines = {setLines}
                game = {game}
            />

            <Container id = "control-bar">
                <RoundPagination
                    maxRound = {Object.keys(game.rounds).length}
                    currentRound = {playbackState.currentRound}
                    changeRound = {changeRound} 
                />

                <Button variant="primary" onClick = {pauseUnpause}>
                    {playbackState.paused? "Play": "Pause"}
                </Button>

                <Toolbar 
                    currentTool={currentTool} 
                    setCurrentTool={setCurrentTool}
                    clearCanvas={clearCanvas}
                />
            </Container>
        </Container>
    );
}

function WatchPage(){
    /*
    // For testing
    const setGame = useContext(GameContext).setGame;
    const initSocket = useContext(SocketContext).initSocket;

    useEffect(() => {
        initSocket('TEST');
        setGame(gameFile);
    }, []);
    */

    return(
        <Container>
            <Game/>
        </Container>
    );
}

export default WatchPage;
