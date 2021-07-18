import React from 'react';
import Image from "react-bootstrap/Image";

function ballPath(color) {
  switch (color) {
    case 5:
      return ("./ball/Blue_ball.png");
    case 4:
      return ("./ball/Green_ball.png");
    case 1:
      return ("./ball/Red_ball.png");
    case 3:
      return ("./ball/Black_ball.png");
    case 2:
      return ("./ball/Orange_ball.png");
    case 6:
      return ("./ball/Purple_ball.png");
    default:
      return ("./ball/Empty_circle.png");
  }
}

function scoreListLongestMove(scoreList, username, type) {
  const score = scoreList.find((item) => item.player === username);

  console.log(scoreList);
  if (score === undefined) {
    return ("none");
  } else {
    console.log("score object = ", score);
    if (type == "longestMove") {
      return (score.score.longestMove);
    } else if (type == "win") {
      return (score.score.win);
    } else if (type == "loss") {
      return (score.score.loss);
    }
  }
}

function PlayerStatList(props) {
  //console.log("props.conversation[props.conversationID] = ", props.conversation[props.conversationID]);
  return (
    <div
      align="left"
      style={{backgroundColor: '#282c34', border: "solid 1px"}}
    >
      <Image src={ballPath(props.item.color)} style={{height: 20, width: 20}}/>
      <a>{"Player " + props.index + ': '}</a>
      <a>{props.item.name }</a>
      <br/>
      <a> {" Longest move: "} {scoreListLongestMove(props.scoreList, props.item.name, "longestMove")}</a>
      <br/>
      <a> {" Nb win: "} {scoreListLongestMove(props.scoreList, props.item.name, "win")}</a>
      <br/>
      <a> {" Nb loss: "} {scoreListLongestMove(props.scoreList, props.item.name, "loss")}</a>
    </div>
  );
}

export default PlayerStatList;