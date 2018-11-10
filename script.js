window.onload = function() {    
  //The initial setup
  let gameBoard = [ 
    [  0,  1,  0,  1,  0,  1,  0,  1 ],
    [  1,  0,  1,  0,  1,  0,  1,  0 ],
    [  0,  1,  0,  1,  0,  1,  0,  1 ],
    [  0,  0,  0,  0,  0,  0,  0,  0 ],
    [  0,  0,  0,  0,  0,  0,  0,  0 ],
    [  2,  0,  2,  0,  2,  0,  2,  0 ],
    [  0,  2,  0,  2,  0,  2,  0,  2 ],
    [  2,  0,  2,  0,  2,  0,  2,  0 ]
  ];
  //distance formula
  let dist = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
  }
  //Piece object - there are 24 instances of them in a checkers game
  function Piece (element, position) {
    //linked DOM element
    this.element = element;
    //positions on gameBoard array in format row, column
    this.position = position; 
    //which player's piece i it
    this.player = '';
    //piece was removed?
    this.removed = false;
    //figure out player by piece id
    if(this.element.attr("id") < 12)
      this.player = 1;
    else
      this.player = 2;
    //makes object a king
    this.king = false;
    this.makeKing = function () {
      if (!Board.pause) {
        this.element.css("backgroundImage", "url('king"+this.player+".png')");
      }
      this.king = true;
    }
    //moves the piece
    this.move = function (tile) { 
      this.element.removeClass('selected'); 
      if(!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
      //make sure piece doesn't go backwards if it's not a king
      if(!this.isValidMove) return false;
      //remove the mark from Board.board and put it in the new spot
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      //change the css using board's dictionary
      if (!Board.pause) {
        this.element.css('top', Board.dictionary[this.position[0]]);
        this.element.css('left', Board.dictionary[this.position[1]]);
      }
      //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
      if(!this.king && (this.position[0] == 0 || this.position[0] == 7 )) 
        this.makeKing();
      if (Board.playerTurn == 1 && this.canJumpAny() && !Board.turnIA) {
        Board.jumping = true;
      }
      changePlayerTurn();
      return true;
    };

    this.isValidMove = function(tile) {
      //make sure piece doesn't go backwards if it's not a king
      if(this.player == 1 && this.king == false) {
        if(tile.position[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if(tile.position[0] > this.position[0]) return false;
      }
      return true;
    }
    
    //tests if piece can jump anywhere
    this.canJumpAny = function () {
      if(this.removed) return false;
      if(this.canOpponentJump([this.position[0]+2, this.position[1]+2]) ||
         this.canOpponentJump([this.position[0]+2, this.position[1]-2]) ||
         this.canOpponentJump([this.position[0]-2, this.position[1]+2]) ||
         this.canOpponentJump([this.position[0]-2, this.position[1]-2])) {
        return true;
      } return false;
    };
    
    //tests if an opponent jump can be made to a specific place
    this.canOpponentJump = function(newPosition) {
      //find what the displacement is
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
      //make sure object doesn't go backwards if not a king
      if(this.player == 1 && this.king == false) {
        if(newPosition[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if(newPosition[0] > this.position[0]) return false;
      }
      //must be in bounds
      if(newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      //middle tile where the piece to be conquered sits
      var tileToCheckx = this.position[1] + dx/2;
      var tileToChecky = this.position[0] + dy/2;
      //if there is a piece there and there is no piece in the space after that
      if(!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        //find which object instance is sitting there
        for(pieceIndex in Board.pieces) {
          if(Board.pieces[pieceIndex].position[0] == tileToChecky && Board.pieces[pieceIndex].position[1] == tileToCheckx) {
            if(this.player != Board.pieces[pieceIndex].player) {
              //return the piece sitting there
              return Board.pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };
    
    this.opponentJump = function (tile) {
      var pieceToRemove = this.canOpponentJump(tile.position);
      //if there is a piece to be removed, remove it
      if(pieceToRemove) {
        Board.pieces[pieceIndex].remove();
        return true;
      }
      return false;
    };
    
    this.remove = function () {
      //remove it and delete it from the gameboard
      if (!Board.pause) {
        this.element.css("display", "none");
        if(this.player == 1) $('#player2').append("<div class='capturedPiece'></div>");
        if(this.player == 2) $('#player1').append("<div class='capturedPiece'></div>");
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      //reset position so it doesn't get picked up by the for loop in the canOpponentJump method
      this.position = [];
      this.removed = true;
    }
  }
  
  function Tile (element, position) {
    //linked DOM element
    this.element = element;
    //position in gameboard
    this.position = position;
    //if tile is in range from the piece
    this.inRange = function(piece) {
      if (!Board.isValidPlacetoMove(this.position[0], this.position[1])) {
        return false;
      }
      if(dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        //regular move
        return 'regular';
      } else if(dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2*Math.sqrt(2)) {
        //jump move
        return 'jump';
      }
    };
  }
  
  //Board object - controls logistics of game
  let Board = {
    board: gameBoard,
    playerTurn: 1,
    turnIA: false,
    pause: false,
    pieces: [],
    tiles: [],
    jumping: false,
    tilesElement: $('div.tiles'),
    //dictionary to convert position in Board.board to the viewport units
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    //initialize the 8x8 board
    initalize: function () {
      var countPieces = 0;
      var countTiles = 0;

      for (row in this.board) { //row is the index
        for (column in this.board[row]) { //column is the index
          
          //whole set of if statements control where the tiles and pieces should be placed on the board
          if(row%2 == 1) {
            if(column%2 == 0) {
              this.tilesElement.append("<div class='tile' id='tile"+countTiles+"' style='top:"+this.dictionary[row]+";left:"+this.dictionary[column]+";'></div>");
              this.tiles[countTiles] = new Tile($("#tile"+countTiles), [parseInt(row), parseInt(column)]);
              countTiles += 1;
            }
          } else {
            if(column%2 == 1) {
              this.tilesElement.append("<div class='tile' id='tile"+countTiles+"' style='top:"+this.dictionary[row]+";left:"+this.dictionary[column]+";'></div>");
              this.tiles[countTiles] = new Tile($("#tile"+countTiles), [parseInt(row), parseInt(column)]);
              countTiles += 1;
            }
          }
          if(this.board[row][column] == 1) {
            $('.player1pieces').append("<div class='piece' id='"+countPieces+"' style='top:"+this.dictionary[row]+";left:"+this.dictionary[column]+";'></div>");
            this.pieces[countPieces] = new Piece($("#"+countPieces), [parseInt(row), parseInt(column)]);
            countPieces += 1;
          } else if(this.board[row][column] == 2) {
            $('.player2pieces').append("<div class='piece' id='"+countPieces+"' style='top:"+this.dictionary[row]+";left:"+this.dictionary[column]+";'></div>");
            this.pieces[countPieces] = new Piece($("#"+countPieces), [parseInt(row), parseInt(column)]);
            countPieces += 1;
          }
        }
      }
    },
    //check if the location has an object
    isValidPlacetoMove: function (row, column) {
      if(this.board[row][column] == 0) {
        return true;
      } return false;
    },
    //reset the game
    clear: function () {
      location.reload(); 
    }
  }
  
  //initialize the board
  Board.initalize();
  
  /***
  Events
  ***/
  
  //select the piece on click if it is the player's turn
  $('.piece').on("click", function () {
    var selected;
    var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player"+Board.playerTurn+"pieces");
    if(isPlayersTurn) {
      if($(this).hasClass('selected')) selected = true;
      $('.piece').each(function(index) {$('.piece').eq(index).removeClass('selected')});
      if(!selected) {
        $(this).addClass('selected');
      }
    }
  });
  
  //reset game when clear button is pressed
  $('#cleargame').on("click", function () {
    Board.clear();
  });
  
  //move piece when tile is clicked
  $('.tile').on("click", function () {
    //make sure a piece is selected
    if($('.selected').length != 0) {
      //find the tile object being clicked
      const tileID = $(this).attr("id").replace(/tile/, '');
      let tile = Board.tiles[tileID];
      //find the piece being selected
      let piece = Board.pieces[$('.selected').attr("id")];
      //check if the tile is in range from the object
      let inRange = tile.inRange(piece);
      if(inRange) {
        //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
        if(inRange == 'jump') {
          if(piece.opponentJump(tile)) {
            piece.move(tile);
            if(piece.canJumpAny()) {
               changePlayerTurn(); //change back to original since another turn can be made
               piece.element.addClass('selected');
            }
          } 
          //if it's regular then move it if no jumping is available
        } else if(inRange == 'regular') {
          if(!canJumpAny()) {
            piece.move(tile);
          } else {
            alert("You must jump when possible!");
          }
        }
      }
    }
  });

  //change the active player - also changes div.turn's CSS
  function changePlayerTurn() {
    if(Board.playerTurn == 1) {
      Board.playerTurn = 2;
      if (!Board.turnIA && !Board.jumping) {
        $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
        Board.turnIA = true;
        Board.pause = true;
        boardBackup = _.cloneDeep(Board);
        result = minimax(3, null);
        Board = boardBackup;
        Board.pause = false;
        moveByValue(result);
        Board.turnIA = false;
      }
      Board.jumping = false;
      return;
    }
    if(Board.playerTurn == 2) {
      Board.playerTurn = 1;
      if (!Board.pause && !Board.turnIA) {
        $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
      }
    }
  }

  function evaluate(board) {
    let value = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (board[i][j] == 2) {
          value += 1;
        } else if (board[i][j] == 1) {
          value -= 1;
        }
      }
    }
    return value;
  }

  function minimax(level, jumping = null) {
    let value = -99999999999;
    let resultPiece = null;
    let resultTile = null;
    let init = 12;
    let final = 24;
    if (Board.playerTurn == 1) {
      value = 999999999;
      init = 0;
      final = 12;
    }
    if (level === 0) {
      return { 
        pieceID: null,
        tileID: null,
        score: evaluate(Board.board)
      };
    } 
    for (let pieceID = init; pieceID < final; pieceID++) {
      for (let tileID = 0; tileID < 32; tileID++) {
        let tile = Board.tiles[tileID];
        let piece = Board.pieces[pieceID];
        if (jumping != null) {
          piece = jumping; // if is jumping mutiple pieces
        }
        let inRange = tile.inRange(piece);
        let boardBackup = null;
        if(inRange && !piece.removed && piece.isValidMove(tile)) {
          //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
          if(inRange == 'jump') {
            if(piece.opponentJump(tile)) {
              boardBackup = copyBoard(Board);
              
              piece.move(tile);
              if(piece.canJumpAny()) {
                changePlayerTurn(); //change back to original since another turn can be made
                value = getMaxOrMin(value, minimax(level).score, piece);
                if(!Board.pause) {
                  piece.element.addClass('selected');
                }
              } else {
                value = getMaxOrMin(value, minimax(level - 1).score, null);
              }
              Board = boardBackup;
              return { 
                pieceID: pieceID,
                tileID: tileID,
                score: value
              };
            } 
            //if it's regular then move it if no jumping is available
          } else if(inRange == 'regular' && jumping == null) {
            if(!canJumpAny()) {
              boardBackup = copyBoard(Board);
              piece.move(tile);
              const oldValue = value;
              value = getMaxOrMin(value, minimax(level - 1).score, null);
              Board = boardBackup;
              if (value != oldValue || resultPiece == null) {
                resultPiece = pieceID;
                resultTile = tileID;
              }
            } else {
              continue;
            }
          }
        }
      }
    }
  
    return { 
      pieceID: resultPiece,
      tileID: resultTile,
      score: evaluate(Board.board)
    };
  }

  function canJumpAny() {
    let init = 12;
    let final = 24;
    if (Board.playerTurn == 1) {
      init = 0;
      final = 12;
    }
    for (let pieceID = init; pieceID < final; pieceID++) {
      if (Board.pieces[pieceID].canJumpAny()) {
        return true;
      }
    }

    return false;
  }

  function moveByValue(result) {
    let tile = Board.tiles[result.tileID];
    let piece = Board.pieces[result.pieceID];
    let inRange = tile.inRange(piece);
    if (result.pieceID != null && result.tileID != null && inRange) {
      result.tileID = null;
      if(inRange == 'jump') {
        if(piece.opponentJump(tile)) {
          piece.move(tile);
          if(piece.canJumpAny()) {
            changePlayerTurn();
            piece.element.addClass('selected');
            moveByValue(result);
          } else {
            result.pieceID = null;
          }
          return;
        }
        //if it's regular then move it if no jumping is available
      } else if(inRange == 'regular') {
        piece.move(tile);
        return;
      }
    } else if (result.pieceID != null) {
      let piece = Board.pieces[result.pieceID];
      for (let tileID = 0; tileID < 32; tileID++) {
        let tile = Board.tiles[tileID];
        let inRange = tile.inRange(piece);

        if(inRange == 'jump') {
          if(piece.opponentJump(tile)) {
            piece.move(tile);
            if(piece.canJumpAny()) {
               changePlayerTurn();
               piece.element.addClass('selected');
               moveByValue(result);
            }
            return;
          }
        } else if(inRange == 'regular') {
          if(!canJumpAny()) {
            piece.move(tile);
            return;
          }
        }
      }
    }
    for (let pieceID = 12; pieceID < 24; pieceID++) {
      for (let tileID = 0; tileID < 32; tileID++) {
        let tile = Board.tiles[tileID];
        let piece = Board.pieces[pieceID];
        let inRange = tile.inRange(piece);

        if (inRange) {
          piece.move(tile);
          return;
        }
      }
    }
  
  }

  function getMaxOrMin(val1, val2) {
    if (Board.playerTurn == 2) {
      return Math.max(val1, val2);
    } else {
      return Math.min(val1, val2);
    }
  }

  function copyBoard(oldBoard) {
    return _.cloneDeep(oldBoard);
  }
  
}