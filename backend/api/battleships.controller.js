import crypto from "crypto";

//---------------------------------------------
var GAMES_IN_MEMORY = [];
// ---Clean GAMES_IN_MEMORY every 5 mins of dead games.(dead game is when no input was made for 5mins)
var CLEANUP_PROCESS = setInterval(() => {
  GAMES_IN_MEMORY.forEach((game, i) => {
    if (new Date().getTime() - game.lastMove > 1000 * 60 * 5) {
      GAMES_IN_MEMORY.splice(i, 1);
    }
  });
}, 18000);
//---------------------------------------------------------------
export default class battleShipController {
  static async apiNewGame(req, res, next) {
    var gameId = undefined;
    const gameBoard = generateNewBoard();
    const boardSize = 10;
    const leftMoves = 25;
    const destroyedTiles = 0;
    const displayBoard = [];

    //generates empty board to display
    for (let col_index = 0; col_index < boardSize; col_index++) {
      let row = [];
      for (let row_index = 0; row_index < boardSize; row_index++) {
        row.push({ sqState: "sqClear" });
      }
      displayBoard.push(row);
    }

    //gameId check | replace game or push new game to memory
    gameId = req.params.gameId;
    if (
      GAMES_IN_MEMORY.findIndex((element) => element.gameId == gameId) != -1
    ) {
      //replace existing game data
      GAMES_IN_MEMORY[
        GAMES_IN_MEMORY.findIndex((element) => element.gameId == gameId)
      ] = {
        gameId: gameId,
        gameBoard: gameBoard,
        destroyedTiles: destroyedTiles,
        leftMoves: leftMoves,
        gameState: "Playing",
        lastMove: new Date().getTime(),
      };
    } else {
      gameId = crypto.randomBytes(20).toString("hex");
      //add game to memory
      GAMES_IN_MEMORY.push({
        gameId: gameId,
        gameBoard: gameBoard,
        destroyedTiles: destroyedTiles,
        leftMoves: leftMoves,
        gameState: "Playing",
        lastMove: new Date().getTime(),
      });
    }

    //response data
    let response = {
      gameId: gameId,
      gameBoard: displayBoard,
      destroyedTiles: destroyedTiles,
      leftMoves: leftMoves,
      gameState: "Playing",
      shipArea: [],
    };
    //send response
    res.json(response);
  }
  //---------------------------------------------
  static async apiGetAllGames(req, res, next) {
    //send response
    res.json(GAMES_IN_MEMORY);
  }
  //---------------------------------------------
  static async apiHitSquare(req, res, next) {
    //find the game based of gameId
    let game = GAMES_IN_MEMORY.find(
      (element) => element.gameId === req.params.gameId
    );

    if (game !== undefined) {
      let coordinates = JSON.parse(req.params.coordinates);
      if (game.gameBoard?.[coordinates.x]?.[coordinates.y]?.isShipHere) {
        game.destroyedTiles += 1;
        if (game.destroyedTiles >= 24) {
          game.gameState = "Won";
        }
        //minus 1 from ship size. Ship size is located at ship front.
        game.gameBoard[
          game.gameBoard[coordinates.x][coordinates.y].shipFront.x
        ][game.gameBoard[coordinates.x][coordinates.y].shipFront.y].shipSize =
          game.gameBoard[
            game.gameBoard[coordinates.x][coordinates.y].shipFront.x
          ][game.gameBoard[coordinates.x][coordinates.y].shipFront.y].shipSize -
          1;
        //
        let response = {
          shotState: "hit",
          destroyedTiles: game.destroyedTiles,
          leftMoves: game.leftMoves,
          gameState: game.gameState,
          shipArea:
            game.gameBoard[
              game.gameBoard[coordinates.x][coordinates.y].shipFront.x
            ][game.gameBoard[coordinates.x][coordinates.y].shipFront.y]
              .shipSize <= 0
              ? game.gameBoard[
                  game.gameBoard[coordinates.x][coordinates.y].shipFront.x
                ][game.gameBoard[coordinates.x][coordinates.y].shipFront.y]
                  .shipArea
              : [],
        };
        res.json(response);
      } else {
        game.leftMoves -= 1;
        if (game.leftMoves <= 0) {
          game.gameState = "Lost";
        }
        let response = {
          shotState: "miss",
          destroyedTiles: game.destroyedTiles,
          leftMoves: game.leftMoves,
          gameState: game.gameState,
          shipArea: [],
          missedShips: game.gameState === "Lost" ? game.gameBoard : [],
        };
        res.json(response);
      }
    } else {
      //send error response
      res.json({ gameState: "Game not found." });
    }
  }
}
//---------------------------------------------------------------
function generateNewBoard() {
  //settings
  const boardSize = 10; //size changes just in backend
  const ships = [5, 4, 3, 3, 2, 2, 2, 1, 1, 1]; //ships sizes

  //generates empty board
  var board = [];
  for (let col_index = 0; col_index < boardSize; col_index++) {
    let row = [];
    for (let row_index = 0; row_index < boardSize; row_index++) {
      row.push({ isShipHere: false });
    }
    board.push(row);
  }

  //generates/verifies every ship placement on board
  ships.forEach((shipSize) => {
    let is_ship_placed = false;
    while (!is_ship_placed) {
      // forward coordinates of the ship [x,y]
      let shipFront = {
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize),
      };
      // ship direction | N=0, E=1, S=2, W=3
      //N=top, E=right, S=down, W=left
      let shipDirection = Math.floor(Math.random() * 4);

      // if generated ship head already has another ships head in it skip.
      if (board[shipFront.x][shipFront.y].isShipHere) {
        continue;
      }

      //selects ship's back based on direction
      let shipBack = { x: -1, y: -1 };
      if (shipDirection === 0) {
        shipBack = { x: shipFront.x, y: shipFront.y - shipSize - 1 };
      } else if (shipDirection === 1) {
        shipBack = { x: shipFront.x + shipSize - 1, y: shipFront.y };
      } else if (shipDirection === 2) {
        shipBack = { x: shipFront.x, y: shipFront.y + shipSize - 1 };
      } else if (shipDirection === 3) {
        shipBack = { x: shipFront.x - shipSize - 1, y: shipFront.y };
      }

      //checks that the ship is not off the board
      if (
        shipBack.x >= boardSize ||
        shipBack.y >= boardSize ||
        shipBack.x < 0 ||
        shipBack.y < 0
      ) {
        continue;
      }
      //checks if ships are overlapping and if ship aria is clear if its clear adds ship area to ship head.
      //if not restarts search and removes .shipArea attribute.
      if (!isShipAreaClear(shipDirection, shipFront, shipSize, board)) {
        delete board[shipFront.x][shipFront.y].shipArea;
        continue;
      }

      //place ship on board
      for (let i = 0; i < shipSize; i++) {
        if (shipSize === 1) {
          board[shipFront.x][shipFront.y].isShipHere = true;
          board[shipFront.x][shipFront.y].shipFront = {
            x: shipFront.x,
            y: shipFront.y,
          };
        } else if (shipDirection === 0) {
          board[shipFront.x][shipFront.y - i].isShipHere = true;
          board[shipFront.x][shipFront.y - i].shipFront = {
            x: shipFront.x,
            y: shipFront.y,
          };
        } else if (shipDirection === 1) {
          board[shipFront.x + i][shipFront.y].isShipHere = true;
          board[shipFront.x + i][shipFront.y].shipFront = {
            x: shipFront.x,
            y: shipFront.y,
          };
        } else if (shipDirection === 2) {
          board[shipFront.x][shipFront.y + i].isShipHere = true;
          board[shipFront.x][shipFront.y + i].shipFront = {
            x: shipFront.x,
            y: shipFront.y,
          };
        } else if (shipDirection === 3) {
          board[shipFront.x - i][shipFront.y].isShipHere = true;
          board[shipFront.x - i][shipFront.y].shipFront = {
            x: shipFront.x,
            y: shipFront.y,
          };
        }
      }

      board[shipFront.x][shipFront.y].shipSize = shipSize;
      is_ship_placed = true;
    }
  });

  //response
  return board;
}
//---------------------------------------------------------------
function isShipAreaClear(shipDirection, shipFront, shipSize, board) {
  board[shipFront.x][shipFront.y].shipArea = [];
  if (shipDirection === 0) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - 1]?.[shipFront.y - i]?.isShipHere ||
        board?.[shipFront.x]?.[shipFront.y - i]?.isShipHere ||
        board?.[shipFront.x + 1]?.[shipFront.y - i]?.isShipHere
      ) {
        return false;
      } else {
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x - 1,
          y: shipFront.y - i,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x,
          y: shipFront.y - i,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x + 1,
          y: shipFront.y - i,
        });
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y + 1]?.isShipHere ||
      board?.[shipFront.x]?.[shipFront.y + 1]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y + 1]?.isShipHere ||
      board?.[shipFront.x - 1]?.[shipFront.y - shipSize]?.isShipHere ||
      board?.[shipFront.x]?.[shipFront.y - shipSize]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y - shipSize]?.isShipHere
    ) {
      return false;
    } else {
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y + 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x,
        y: shipFront.y + 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y + 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y - shipSize,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x,
        y: shipFront.y - shipSize,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y - shipSize,
      });
    }
  } else if (shipDirection === 1) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x + i]?.[shipFront.y - 1]?.isShipHere ||
        board?.[shipFront.x + i]?.[shipFront.y]?.isShipHere ||
        board?.[shipFront.x + i]?.[shipFront.y + 1]?.isShipHere
      ) {
        return false;
      } else {
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x + i,
          y: shipFront.y - 1,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x + i,
          y: shipFront.y,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x + i,
          y: shipFront.y + 1,
        });
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y + 1]?.isShipHere ||
      board?.[shipFront.x - 1]?.[shipFront.y]?.isShipHere ||
      board?.[shipFront.x - 1]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x + shipSize]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x + shipSize]?.[shipFront.y]?.isShipHere ||
      board?.[shipFront.x + shipSize]?.[shipFront.y + 1]?.isShipHere
    ) {
      return false;
    } else {
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y + 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + shipSize,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + shipSize,
        y: shipFront.y,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + shipSize,
        y: shipFront.y + 1,
      });
    }
  } else if (shipDirection === 2) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - 1]?.[shipFront.y + i]?.isShipHere ||
        board?.[shipFront.x]?.[shipFront.y + i]?.isShipHere ||
        board?.[shipFront.x + 1]?.[shipFront.y + i]?.isShipHere
      ) {
        return false;
      } else {
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x - 1,
          y: shipFront.y + i,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x,
          y: shipFront.y + i,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x + 1,
          y: shipFront.y + i,
        });
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x - 1]?.[shipFront.y + shipSize]?.isShipHere ||
      board?.[shipFront.x]?.[shipFront.y + shipSize]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y + shipSize]?.isShipHere
    ) {
      return false;
    } else {
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - 1,
        y: shipFront.y + shipSize,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x,
        y: shipFront.y + shipSize,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y + shipSize,
      });
    }
  } else if (shipDirection === 3) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - i]?.[shipFront.y - 1]?.isShipHere ||
        board?.[shipFront.x - i]?.[shipFront.y]?.isShipHere ||
        board?.[shipFront.x - i]?.[shipFront.y + 1]?.isShipHere
      ) {
        return false;
      } else {
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x - i,
          y: shipFront.y - 1,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x - i,
          y: shipFront.y,
        });
        board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
          x: shipFront.x - i,
          y: shipFront.y + 1,
        });
      }
    }
    if (
      board?.[shipFront.x + 1]?.[shipFront.y + 1]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y]?.isShipHere ||
      board?.[shipFront.x + 1]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x - shipSize]?.[shipFront.y - 1]?.isShipHere ||
      board?.[shipFront.x - shipSize]?.[shipFront.y]?.isShipHere ||
      board?.[shipFront.x - shipSize]?.[shipFront.y + 1]?.isShipHere
    ) {
      return false;
    } else {
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y + 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x + 1,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - shipSize,
        y: shipFront.y - 1,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - shipSize,
        y: shipFront.y,
      });
      board?.[shipFront.x]?.[shipFront.y]?.shipArea.push({
        x: shipFront.x - shipSize,
        y: shipFront.y + 1,
      });
    }
  }
  return true;
}
//---------------------------------------------------------------
