import './Style.css';
import React, { useState, useEffect } from "react";
import PlayerStatList from "./PlayerStatList";

function GameOver(props) {
    const search = props.location.search; // returns the URL query String
    const params = new URLSearchParams(search); 
    const roomId = params.get('roomId');
    const [winnerName, setWinnerName] = useState("");
    const [scoreList, setScoreList] = useState([]);
    const [playerList, setPlayerList] = useState([]);

    useEffect(() => {
      console.log("useEffect call");
      fetch(`http://localhost:3001/games/${roomId}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
        .then((response) => response.json())
        .then(async (answer) => {
          if (answer) {
            console.log("answer = ", answer);
            setWinnerName(answer.winner);
            setPlayerList(answer.players);
          } else {
            console.log("error");
          }
        })
        .catch((error) => {
          console.error('error :', error);
        });

      fetch(`http://localhost:3001/scores`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })
          .then((response) => response.json())
          .then(async (answer) => {
            if (answer) {
              console.log("answer score = ", answer);
              setScoreList(answer);
            } else {
              console.log("error");
            }
          })
          .catch((error) => {
            console.error('error :', error);
          });
    }, []);

    return (
      <div className="Style">
        <header className="Style-header">
          <div>
            <p>{"Game over!"}</p>
            {winnerName && (<p>{"The winner is " + winnerName}</p>)}
          </div>
          <div>
            {playerList && (playerList.map((item, index) => (
              <PlayerStatList index={index + 1} item={item} scoreList={scoreList} key={item.name}/>
            )))}
          </div>
        </header>
      </div>
    );
  }

export default GameOver;
