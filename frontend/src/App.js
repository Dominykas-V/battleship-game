import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
// ----------------------------------------------------------------------
function App() {
  const [gameData, setGameData] = useState({
    gameId: "NaN",
    gameBoard: [[]],
    destroyedTiles: 0,
    leftMoves: 25,
    gameState: "Loading",
  });
  // ---------------------------------
  function hitSquare(coordinates) {
    axios
      .get(
        `/api/v1/battleships/hit/${gameData.gameId}/{ "x":${coordinates.x},"y":${coordinates.y}}`
      )
      .then((res) => {
        console.log(res.data);

        let tempGameData = { ...gameData };
        tempGameData.leftMoves = res.data.leftMoves;
        tempGameData.destroyedTiles = res.data.destroyedTiles;
        tempGameData.gameState = res.data.gameState;

        if (res.data.shotState === "hit") {
          tempGameData.gameBoard[coordinates.x][coordinates.y].class =
            "box-hit";
        } else {
          tempGameData.gameBoard[coordinates.x][coordinates.y].class =
            "box-missed";
        }

        setGameData(tempGameData);
      });
  }
  // ---------------------------------
  function newGame() {
    axios.get(`api/v1/battleships/new_game/${gameData.gameId}`).then((res) => {
      setGameData(res.data);
    });
  }
  // ---------------------------------
  //Triggers 2 times because of <React.StrictMode>
  useEffect(() => {
    fetch("api/v1/battleships/new_game")
      .then((response) => response.json())
      .then((data) => {
        setGameData(data);
      });
  }, []);
  // ----------------------------------------------------------------------
  return (
    <div>
      <div className="d-lg-none text-center">
        <h1>BattleShip game!</h1>
        <h1>Your screen is too small to play!</h1>
      </div>
      <div className="text-center d-none d-lg-block">
        <div className="row">
          <div className="col-4">
            <div className="p-2 pt-5">
              <h1>BattleShip game!</h1>
            </div>
            {typeof gameData === "undefined" ? (
              <>
                <div className="fs-4">
                  <span>Moves left: Loading...</span>
                </div>
                <div className="fs-4">
                  <span>Hits: Loading...</span>
                </div>
              </>
            ) : (
              <>
                <div className="fs-4">
                  <span>Moves left: {gameData.leftMoves}</span>
                </div>
                <div className="fs-4">
                  <span>Hits: {gameData.destroyedTiles}</span>
                </div>
                <div>
                  <span className="fs-2 ">
                    {gameData.gameState === "Lost"
                      ? "You lost. Try again?"
                      : gameData.gameState === "Win"
                      ? "You Won! Try to beat it again!"
                      : gameData.gameState === "Game not found."
                      ? "404: Game not found."
                      : null}
                  </span>
                </div>
              </>
            )}
            <div className="pt-4">
              <button type="button" className="new_game_btn" onClick={newGame}>
                <span className="hover-underline-animation"> New game </span>
                <svg
                  viewBox="0 0 46 16"
                  height="10"
                  width="30"
                  xmlns="http://www.w3.org/2000/svg"
                  id="arrow-horizontal"
                >
                  <path
                    transform="translate(30)"
                    d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z"
                    data-name="Path 10"
                    id="Path_10"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
          <div className="col-8">
            <div
              className={
                gameData.gameState === "Lost"
                  ? "game_blocker-loser"
                  : gameData.gameState === "Won"
                  ? "game_blocker-winner"
                  : gameData.gameState === "Game not found."
                  ? "game_blocker-404"
                  : null
              }
            ></div>
            <div className="container">
              <div className="row">
                <div className="col-sm-1 board-legend-letter"></div>
                <div className="col-sm-1 board-legend-letter">
                  <span>A</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>B</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>C</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>D</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>E</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>F</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>G</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>H</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>I</span>
                </div>
                <div className="col-sm-1 board-legend-letter">
                  <span>J</span>
                </div>
              </div>
              {typeof gameData === "undefined" ? (
                <span className="fs-5">Loading...</span>
              ) : (
                gameData.gameBoard.map((col, col_i) => {
                  return (
                    <div className="row">
                      {col.map((row, row_i) => {
                        if (row_i === 0) {
                          return (
                            <>
                              <div className="col-sm-1 board-legend-number">
                                <span>{col_i + 1}</span>
                              </div>{" "}
                              <div
                                className="col-sm-1"
                                key={`${col_i}${row_i}`}
                                onClick={() =>
                                  row.class === "box-clear"
                                    ? hitSquare({ x: col_i, y: row_i })
                                    : null
                                }
                              >
                                <div className={row.class}></div>
                              </div>
                            </>
                          );
                        }
                        return (
                          <div
                            className="col-sm-1"
                            key={`${col_i}${row_i}`}
                            onClick={() =>
                              row.class === "box-clear"
                                ? hitSquare({ x: col_i, y: row_i })
                                : null
                            }
                          >
                            <div className={row.class}></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
// ----------------------------------------------------------------------
