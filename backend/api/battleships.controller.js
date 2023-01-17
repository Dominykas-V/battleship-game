import crypto from "crypto";

//---------------------------------------------
var GAMES_IN_MEMORY = [];
//---------------------------------------------------------------
export default class battleShipController {
  static async apiNewGame(req, res, next) {
    const gameId = crypto.randomBytes(20).toString("hex");
    const gameBoard = generateNewBoard();
    const boardSize = 10;
    const leftMoves = 25;
    const destroyedTiles = 0;
    const displayBoard = [];

    //generates empty board to display
    for (let col_index = 0; col_index < boardSize; col_index++) {
      let row = [];
      for (let row_index = 0; row_index < boardSize; row_index++) {
        row.push({ class: "box-clear" });
      }
      displayBoard.push(row);
    }

    //add game to memory
    GAMES_IN_MEMORY.push({
      gameId: gameId,
      gameBoard: gameBoard,
      destroyedTiles: destroyedTiles,
      leftMoves: leftMoves,
      gameState: "playing",
    });

    //response data
    let response = {
      gameId: gameId,
      gameBoard: displayBoard,
      destroyedTiles: destroyedTiles,
      leftMoves: leftMoves,
      gameState: "playing",
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
      if (game.gameBoard?.[coordinates.x]?.[coordinates.y] === 1) {
        game.destroyedTiles += 1;
        if (game.destroyedTiles >= 24) {
          game.gameState = "Won";
          delete GAMES_IN_MEMORY[
            GAMES_IN_MEMORY.findIndex((obj) => obj.gameId === req.params.gameId)
          ];
        }
        let response = {
          shotState: "hit",
          destroyedTiles: game.destroyedTiles,
          leftMoves: game.leftMoves,
          gameState: game.gameState,
        };
        res.json(response);
      } else {
        game.leftMoves -= 1;
        if (game.leftMoves <= 0) {
          game.gameState = "Lost";
          delete GAMES_IN_MEMORY[
            GAMES_IN_MEMORY.findIndex((obj) => obj.gameId === req.params.gameId)
          ];
        }
        let response = {
          shotState: "miss",
          destroyedTiles: game.destroyedTiles,
          leftMoves: game.leftMoves,
          gameState: game.gameState,
        };
        res.json(response);
      }
    } else {
      //send error response
      res.json({ error: "Game not found." });
    }
  }
}
//---------------------------------------------------------------
function generateNewBoard() {
  //settings
  const boardSize = 10; //size changes just in backend
  const ships = [5, 4, 3, 3, 2, 2, 2, 1, 1, 1]; //ships sizes

  //generates empty board
  let board = [];
  for (let col_index = 0; col_index < boardSize; col_index++) {
    let row = [];
    for (let row_index = 0; row_index < boardSize; row_index++) {
      row.push(0);
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
      //checks if ships are overlapping and if ship aria is clear
      if (!isShipAreaClear(shipDirection, shipFront, shipSize, board)) {
        continue;
      }

      //place ship on board
      for (let i = 0; i < shipSize; i++) {
        if (shipSize === 1) {
          board[shipFront.x][shipFront.y] = 1;
        } else if (shipDirection === 0) {
          board[shipFront.x][shipFront.y - i] = 1;
        } else if (shipDirection === 1) {
          board[shipFront.x + i][shipFront.y] = 1;
        } else if (shipDirection === 2) {
          board[shipFront.x][shipFront.y + i] = 1;
        } else if (shipDirection === 3) {
          board[shipFront.x - i][shipFront.y] = 1;
        }
      }

      is_ship_placed = true;
    }
  });

  //response
  return board;
}
//---------------------------------------------------------------
function isShipAreaClear(shipDirection, shipFront, shipSize, board) {
  if (shipDirection === 0) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - 1]?.[shipFront.y - i] === 1 ||
        board?.[shipFront.x]?.[shipFront.y - i] === 1 ||
        board?.[shipFront.x + 1]?.[shipFront.y - i] === 1
      ) {
        return false;
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y + 1] === 1 ||
      board?.[shipFront.x]?.[shipFront.y + 1] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y + 1] === 1 ||
      board?.[shipFront.x - 1]?.[shipFront.y - shipSize] === 1 ||
      board?.[shipFront.x]?.[shipFront.y - shipSize] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y - shipSize] === 1
    ) {
      return false;
    }
  } else if (shipDirection === 1) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x + i]?.[shipFront.y - 1] === 1 ||
        board?.[shipFront.x + i]?.[shipFront.y] === 1 ||
        board?.[shipFront.x + i]?.[shipFront.y + 1] === 1
      ) {
        return false;
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y + 1] === 1 ||
      board?.[shipFront.x - 1]?.[shipFront.y] === 1 ||
      board?.[shipFront.x - 1]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x + shipSize]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x + shipSize]?.[shipFront.y] === 1 ||
      board?.[shipFront.x + shipSize]?.[shipFront.y + 1] === 1
    ) {
      return false;
    }
  } else if (shipDirection === 2) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - 1]?.[shipFront.y + i] === 1 ||
        board?.[shipFront.x]?.[shipFront.y + i] === 1 ||
        board?.[shipFront.x + 1]?.[shipFront.y + i] === 1
      ) {
        return false;
      }
    }
    if (
      board?.[shipFront.x - 1]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x - 1]?.[shipFront.y + shipSize] === 1 ||
      board?.[shipFront.x]?.[shipFront.y + shipSize] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y + shipSize] === 1
    ) {
      return false;
    }
  } else if (shipDirection === 3) {
    for (let i = 0; i < shipSize; i++) {
      if (
        board?.[shipFront.x - i]?.[shipFront.y - 1] === 1 ||
        board?.[shipFront.x - i]?.[shipFront.y] === 1 ||
        board?.[shipFront.x - i]?.[shipFront.y + 1] === 1
      ) {
        return false;
      }
    }
    if (
      board?.[shipFront.x + 1]?.[shipFront.y + 1] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y] === 1 ||
      board?.[shipFront.x + 1]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x - shipSize]?.[shipFront.y - 1] === 1 ||
      board?.[shipFront.x - shipSize]?.[shipFront.y] === 1 ||
      board?.[shipFront.x - shipSize]?.[shipFront.y + 1] === 1
    ) {
      return false;
    }
  }
  return true;
}
//---------------------------------------------------------------
