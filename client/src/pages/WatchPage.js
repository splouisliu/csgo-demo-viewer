import React, {useEffect, useRef, useState, useContext} from 'react';
import {Jumbotron, Container, Pagination, Button, Alert} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './WatchPage.css';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";


function PlaybackArea(props){
    const drawDots = props.dotPositions.map(position=>{
        return <div class ="dot" style = {{"left": position.x, "bottom": position.y}}/>
    });
        
    return(
        <div id="map">
            {drawDots}
        </div>
    );
}

function ControlBar (props){
    const [active, setActive] = useState(props.currentRound);
    let items = [];

    useEffect(()=>{
        setActive(props.currentRound);
    },[props.currentRound]);

    function changeRound(i){
        setActive(i);
        props.changeRound(i);
    }


    // Displaying pagination numbers
    for (let number = 1; number <= props.maxRounds; number++) {
        items.push(
          <Pagination.Item key={number} active={number === active} onClick={()=>changeRound(number)}>
            {number}
          </Pagination.Item>,
        );
      }

    return(
        <div>
          <Pagination>{items}</Pagination>
          <Button variant="primary" onClick = {props.pauseUnpause}>{props.paused? "Play": "Pause"}</Button>{' '}
        </div>
    );
};


function Game(props){
    const game = useContext(GameContext).game;
    const socket = useContext(SocketContext);
    const [dotPositions, setDotPositions] = useState([]);
    const [playbackState, setPlaybackState] = useState({
        currentRound: 1,
        t: 0,
        paused: true
    });

    //console.log("init");

    function updatePlayerDots(round, t){
        if(game.rounds[round] != null){
            
            // For position calibration
            const x0 = 535, y0 = -527;   
            const xg0 = -520, yg0 = -984;
            const k = 0.2;

            let players = game.rounds[round].player_positions[t].players;
            let newDotPositions = [];
            
            console.log(round);
            for(const i in players){
                if(players[i].position != null){     // checks if player is still alive
                    let xg = players[i].position.x;
                    let yg = players[i].position.y;
                    let x = x0 + (xg-xg0)*k;
                    let y = y0 + (yg-yg0)*k;

                    newDotPositions.push({x,y});
                }
            }

            setDotPositions(newDotPositions);
        }
    }
    
    
    useInterval(()=>{
        if(!playbackState.paused && game != null && game.rounds[playbackState.currentRound] != null 
            && playbackState.t < game.rounds[playbackState.currentRound].player_positions.length){
                
            updatePlayerDots(playbackState.currentRound, playbackState.t);
            setPlaybackState({currentRound: playbackState.currentRound, t: playbackState.t+1, paused: playbackState.paused});
        }
        //console.log("tick");   
    },7);
     

    useEffect(()=>{
        socket.on("update", state =>{
            setPlaybackState(state);

            if(game != null)
                updatePlayerDots(state.currentRound, state.t);
        });
    },[]);

    function changeRound(i){
        setDotPositions([]);

        let newState = {currentRound: i, t:0, paused: true};
        setPlaybackState(newState);

        // Set initial player locations
        if(game != null)
            updatePlayerDots(i, 0);
    
        socket.emit("playbackUpdate", newState);
    }

    function pauseUnpause(){
        let newState = {currentRound: playbackState.currentRound, t:playbackState.t, paused: playbackState.paused ? false: true};
        setPlaybackState(newState);

        socket.emit("playbackUpdate", newState);
    }

    return(
        <Container>
            <Jumbotron>
                <PlaybackArea dotPositions= {dotPositions}/>
                <ControlBar 
                    maxRounds = {game == null ? 30 : Object.keys(game.rounds).length} 
                    changeRound = {changeRound} 
                    pauseUnpause = {pauseUnpause}
                    currentRound = {playbackState.currentRound}
                    paused = {playbackState.paused}
                    />
            </Jumbotron>
        </Container>
    );

}

function WatchPage(){
    return(
        <Container>
            <Game/>
        </Container>
    )
}

//~~~~~~~~~~~~~~~~~

function useInterval(callback, delay) {
    const savedCallback = useRef();
  
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

export default WatchPage;
