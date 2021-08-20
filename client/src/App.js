import React from 'react';
import {BrowserRouter as Router, Route} from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import WatchPage from "./pages/WatchPage";
import {SocketProvider} from "./contexts/SocketProvider";
import {GameProvider} from "./contexts/GameProvider";


function App() {
	return(
		<SocketProvider>
			<GameProvider>
				<Router>
					<switch>
						<Route exact path="/" component= {HomePage}/>
						<Route path="/create" component= {CreateRoomPage}/>
						<Route path="/join" component= {JoinRoomPage}/>
						<Route path="/watch" component= {WatchPage}/>
					</switch>
				</Router>
			</GameProvider>
		</SocketProvider>
	)
}

export default App;
