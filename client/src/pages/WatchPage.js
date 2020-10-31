import React, {useEffect, useRef, useState, useContext} from 'react';
import {Jumbotron, Container, Pagination} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './WatchPage.css';
import {SocketContext} from "../contexts/SocketProvider";
import {GameContext} from "../contexts/GameProvider";
//import json from './123.json';


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

function ControlBar(props){
    const [active, setActive] = useState(1);
    let items = [];

    function handleClick(i){
        setActive(i);
        props.onClick(i);
    }

    // Displaying pagination numbers
    for (let number = 1; number <= props.maxRounds; number++) {
        items.push(
          <Pagination.Item key={number} active={number === active} onClick={()=>handleClick(number)}>
            {number}
          </Pagination.Item>,
        );
      }

    return(
        <div>
          <Pagination>{items}</Pagination>
        </div>
    );
}


function Game(props){
    const game = useContext(GameContext).game;
    const socket = useContext(SocketContext);
    const [dotPositions, setDotPositions] = useState([]);
    const [playbackState, setPlaybackState] = useState({
        currentRound: 1,
        t: 0, 
    });
    
    useInterval(()=>{
        // For position calibration
        const x0 = 535, y0 = -527;   
        const xg0 = -520, yg0 = -984;
        const k = 0.2;

        if(game != null && playbackState.t < game.rounds[playbackState.currentRound].player_positions.length){
            let players = game.rounds[playbackState.currentRound].player_positions[playbackState.t].players;

            let newDotPositions = [];
            
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
            setPlaybackState({currentRound: playbackState.currentRound, t: playbackState.t+1});
        }
        console.log("tick");   

        socket.on("update", state =>{
        setPlaybackState(state);
        });
    },5);

    function handleClick(i){
        setDotPositions([]);
        setPlaybackState({currentRound: i, t:0});

        //socket.emit("playbackUpdate", playbackState);
    }

    return(
        <Jumbotron>
            <PlaybackArea dotPositions= {dotPositions}/>
            <ControlBar maxRounds = {game == null ? 30 : Object.keys(game.rounds).length} onClick = {handleClick}/>
        </Jumbotron>
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
