// Muzsika
let currentMusic = null;
let loopStart = null;
let loopEnd = null;
let loopListener = null;

function playMusic(src, options = {}) {
  if (currentMusic) {
    fadeOutMusic(currentMusic);
  }

  const audio = new Audio(src);
  audio.volume = options.volume ?? 0.5;
  audio.loop = false;
  audio.currentTime = options.loopStart ?? 0;

  loopStart = options.loopStart;
  loopEnd = options.loopEnd;
  currentMusic = audio;

  if (loopStart !== undefined && loopEnd !== undefined) {
    loopListener = () => {
      if (audio.currentTime >= loopEnd) {
        audio.currentTime = loopStart;
        audio.play();
      }
    };
    audio.addEventListener("timeupdate", loopListener);
  }

  audio.play();
}
function fadeOutMusic(audio, speed = 0.02, callback) {
  const fadeInterval = setInterval(() => {
    if (audio.volume > speed) {
      audio.volume -= speed;
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fadeInterval);

      if (loopListener && typeof loopListener === "function") {
        audio.removeEventListener("timeupdate", loopListener);
        loopListener = null;
        loopStart = null;
        loopEnd = null;
      }

      if (typeof callback === "function") callback();
    }
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  // Hajó típusok
  const shipLimits = {
    5: 1, // Carrier
    4: 1, // Battleship
    3: 5, // Submarine & cruser
    2: 3, // Destroyer
  };

  let shipCounts = {
    1: { 5: 0, 4: 0, 3: 0, 2: 0 },
    2: { 5: 0, 4: 0, 3: 0, 2: 0 },
  };

  const gridSize = 10;
  let currentPlayer = 1;
  let playerBoards = { 1: new Set(), 2: new Set() }; // Játékos táblák
  let playerScores = { 1: 0, 2: 0 }; // Pontok követése
  let placingShips = true;
  let placedShips = { 1: [], 2: [] }; // A Játékosok által lerakott hajók követése
  let killstreak = false;
  let vertical = false;
  let draggedShipSize = null;
  let dragPreview = null;
  let dragOverCell = null;

  const sizesAndNames = [
    {
      size: 5,
      name: "carrier",
      width: "65px",
      height: "400px",
      horizontalTransform: "translate(-8px, -325px)",
      verticalTransform: "translate(-10px, -75px)",
      shipyardConfig: {
        width: "40px",
        height: "130px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 4,
      name: "battleship",
      width: "50px",
      height: "225px",
      horizontalTransform: "translate(0px, -215px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "120px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 3,
      name: "cruser",
      width: "50px",
      height: "170px",
      horizontalTransform: "translate(0px, -160px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 3,
      name: "cruser",
      width: "50px",
      height: "170px",
      horizontalTransform: "translate(0px, -160px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 3,
      name: "submarine",
      width: "50px",
      height: "170px",
      horizontalTransform: "translate(0px, -160px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 3,
      name: "submarine",
      width: "50px",
      height: "170px",
      horizontalTransform: "translate(0px, -160px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 3,
      name: "submarine",
      width: "50px",
      height: "170px",
      horizontalTransform: "translate(0px, -160px)",
      verticalTransform: "translate(0px, -10px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 2,
      name: "destroyer",
      width: "50px",
      height: "125px",
      horizontalTransform: "translate(0px, -115px)",
      verticalTransform: "translate(0px, -15px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 2,
      name: "destroyer",
      width: "50px",
      height: "125px",
      horizontalTransform: "translate(0px, -115px)",
      verticalTransform: "translate(0px, -15px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
    {
      size: 2,
      name: "destroyer",
      width: "50px",
      height: "125px",
      horizontalTransform: "translate(0px, -115px)",
      verticalTransform: "translate(0px, -15px)",
      shipyardConfig: {
        width: "20px",
        height: "100px",
        transform: "rotate(0deg) translate(0px, 0px)",
      },
    },
  ];

  let targetIndex = 0;
  let targetPlayer = null;

  // A hajók elforgatása (kiírás)
  let forcePreviewUpdate = false;
  let isDragging = false;

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
      vertical = !vertical;
      document.getElementById("message").textContent = `Rotation: ${
        vertical ? "Vertical" : "Horizontal"
      }`;

      if (isDragging && currentDragCell) {
        removeDragPreview();
        showDragPreview(currentDragCell, draggedShipSize);
      }
    }
  });

  let currentDragCell = null;

  const music = new Audio("./audio/victory.mp3");
  music.volume = 0.5;
  music.loop = true;

  // Táblák generálása
  function createGrid(gridId, player) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = "";

    const letters = "ABCDEFGHIJ".split("");

    const wrapper = document.createElement("div");
    wrapper.classList.add("grid-wrapper");
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns = `50px repeat(${gridSize}, 50px)`;
    wrapper.style.gridTemplateRows = `50px repeat(${gridSize}, 50px)`;
    wrapper.style.gap = "1px";

    // Bal felső sarok (üres)
    const corner = document.createElement("div");
    wrapper.appendChild(corner);

    // Felső A–J cimkék (oszlopoknak)
    for (let col = 0; col < gridSize; col++) {
      const colLabel = document.createElement("div");
      colLabel.textContent = letters[col];
      colLabel.style.textAlign = "center";
      colLabel.style.lineHeight = "30px";
      colLabel.style.fontWeight = "bold";
      wrapper.appendChild(colLabel);
    }

    // Sorok 1-10
    for (let row = 0; row < gridSize; row++) {
      const rowLabel = document.createElement("div");
      rowLabel.textContent = row + 1;
      rowLabel.style.textAlign = "center";
      rowLabel.style.lineHeight = "40px";
      rowLabel.style.fontWeight = "bold";
      wrapper.appendChild(rowLabel);

      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col;
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = index;
        cell.dataset.player = player;

        cell.addEventListener("click", handleCellClick);

        cell.addEventListener("dragover", (e) => {
          e.preventDefault();
          cell.classList.add("drag-over");

          if (currentDragCell !== cell || forcePreviewUpdate) {
            currentDragCell = cell;
            removeDragPreview();
            showDragPreview(cell, draggedShipSize);
            forcePreviewUpdate = false;
          }
        });

        cell.addEventListener("dragleave", () => {
          cell.classList.remove("drag-over");
          removeDragPreview();
          currentDragCell = null;
        });

        cell.addEventListener("drop", (e) => {
          e.preventDefault();
          cell.classList.remove("drag-over");
          removeDragPreview();
          currentDragCell = null;

          const size = parseInt(e.dataTransfer.getData("shipSize"));
          const shipName = e.dataTransfer.getData("shipName");

          const dropIndex = parseInt(cell.dataset.index);
          const dropPlayer = parseInt(cell.dataset.player);

          if (placingShips && currentPlayer === dropPlayer) {
            if (
              shipCounts[dropPlayer][size] < shipLimits[size] &&
              isValidPlacement(dropPlayer, dropIndex, size)
            ) {
              let cellsUsed = [];

              for (let j = 0; j < size; j++) {
                const offset = vertical ? j * gridSize : j;
                const shipCellIndex = dropIndex + offset;
                const shipCell = wrapper.querySelector(
                  `[data-index='${shipCellIndex}']`
                );
                shipCell.classList.add("ship");
                playerBoards[dropPlayer].add(shipCellIndex);
                cellsUsed.push(shipCellIndex);
              }

              placedShips[dropPlayer].push({
                size: size,
                positions: cellsUsed,
              });

              checkShipPlacementComplete();

              addShipImage(
                `grid${dropPlayer}`,
                dropIndex,
                size,
                vertical ? "vertical" : "horizontal",
                `./images/ships/${shipName}.svg`,
                shipName
              );

              shipCounts[dropPlayer][size]++;
              updateShipDropdown();
              removePlacedShipFromSelection(size);

              if (placedShips[1].length >= 10 && placedShips[2].length >= 10) {
                placingShips = false;
                fadeOutAudio("./audio/victory.mp3", 1000);
                showStartOverlay(() => {
                  showTurnOverlay(currentPlayer, () => {
                    document.getElementById(
                      "turn"
                    ).textContent = `Player ${currentPlayer}'s Turn`;
                  });
                });
                document.getElementById("reset-player1-board").disabled = true;
                document.getElementById("reset-player2-board").disabled = true;
              } else {
                if (placedShips[currentPlayer].length >= 10) {
                  updateShipDropdown();
                }
                document.getElementById(
                  "turn"
                ).textContent = `Player ${currentPlayer}: Place Your Ships`;
              }
            } else {
              cell.classList.add("invalid-drop");
              setTimeout(() => cell.classList.remove("invalid-drop"), 500);
            }
          }
        });

        wrapper.appendChild(cell);
      }
    }

    grid.appendChild(wrapper);
  }

  let draggingPlayer = null;

  function setupDraggableShips() {
    document.querySelectorAll(".draggable-ship").forEach((ship) => {
      ship.addEventListener("dragstart", (e) => {
        isDragging = true;
        draggedShipSize = ship.dataset.size;
        e.dataTransfer.setData("shipSize", ship.dataset.size);
        e.dataTransfer.setData("shipName", ship.dataset.name);

        if (e.target.closest("#player1-shipyard")) {
          draggingPlayer = 1;
        } else if (e.target.closest("#player2-shipyard")) {
          draggingPlayer = 2;
        }

        document.getElementById("message").textContent =
          "Dragging ship of size " + draggedShipSize;
      });
      ship.addEventListener("dragend", (e) => {
        isDragging = false;
        removeDragPreview();
      });
    });
  }

  function removePlacedShipFromSelection(size) {
    const ship = document.querySelector(`.draggable-ship[data-size='${size}']`);
    console.log(size);
    if (ship) ship.remove();
  }

  function showDragPreview(cell, size) {
    removeDragPreview();
    if (!placingShips || !draggedShipSize || !cell) return;

    const grid = cell.parentElement;
    const index = parseInt(cell.dataset.index);
    const player = parseInt(cell.dataset.player);

    const cellSize = cell.offsetWidth;
    const top = cell.offsetTop;
    const left = cell.offsetLeft;

    dragPreview = document.createElement("div");
    dragPreview.classList.add("drag-preview");
    dragPreview.style.width = vertical
      ? `${cellSize}px`
      : `${cellSize * size}px`;
    dragPreview.style.height = vertical
      ? `${cellSize * size}px`
      : `${cellSize}px`;
    dragPreview.style.position = "absolute";
    dragPreview.style.pointerEvents = "none";
    dragPreview.style.backgroundColor = "rgba(0, 255, 0, 0.3)";

    if (!isValidPlacement(player, index, size)) {
      dragPreview.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
    }

    dragPreview.style.top = `${top}px`;
    dragPreview.style.left = `${left}px`;

    grid.parentElement.appendChild(dragPreview);
  }

  function updateDragPreviewOrientation() {
    if (!dragPreview || !draggedShipSize) return;
    const cellSize = 55;
    dragPreview.style.width = vertical
      ? `${cellSize}px`
      : `${cellSize * draggedShipSize}px`;
    dragPreview.style.height = vertical
      ? `${cellSize * draggedShipSize}px`
      : `${cellSize}px`;
  }

  function removeDragPreview() {
    if (dragPreview) {
      dragPreview.remove();
      dragPreview = null;
    }
  }

  function handleCellClick(event) {
    const cell = event.target;
    if (!cell.classList.contains("cell")) return; // A cimkékre való klikkelés ignorálása

    const grid = cell.parentElement;
    const i = parseInt(cell.dataset.index);
    const player = parseInt(cell.dataset.player);

    if (placingShips) {
      const shipSize = parseInt(document.getElementById("shipType").value);

      if (
        currentPlayer === player &&
        shipCounts[player][shipSize] < shipLimits[shipSize] &&
        isValidPlacement(player, i, shipSize)
      ) {
        let cellsUsed = [];

        for (let j = 0; j < shipSize; j++) {
          const offset = vertical ? j * gridSize : j;
          const shipCellIndex = i + offset;
          const shipCell = grid.querySelector(
            `.cell[data-index="${shipCellIndex}"]`
          );

          shipCell.classList.add("ship");
          playerBoards[player].add(shipCellIndex);
          cellsUsed.push(shipCellIndex);
        }

        placedShips[player].push({
          size: shipSize,
          positions: cellsUsed,
        });

        shipCounts[player][shipSize]++;
        updateShipDropdown();
        removePlacedShipFromSelection(shipSize);
        checkShipPlacementComplete();

        if (placedShips[1].length >= 10 && placedShips[2].length >= 10) {
          placingShips = false;
          showStartOverlay(() => {
            showTurnOverlay(currentPlayer, () => {
              document.getElementById(
                "turn"
              ).textContent = `Player ${currentPlayer}'s Turn`;
            });
          });
        } else {
          if (placedShips[currentPlayer].length >= 10) {
            updateShipDropdown();
          }
          document.getElementById(
            "turn"
          ).textContent = `Player ${currentPlayer}: Place Your Ships`;
        }
      }
    } else {
      const opponent = currentPlayer === 1 ? 2 : 1;

      if (
        player !== opponent ||
        cell.classList.contains("hit") ||
        cell.classList.contains("miss")
      )
        return;

      const opponentGrid = document.getElementById(`grid${opponent}`);
      const opponentCell = opponentGrid.querySelector(
        `.cell[data-index="${i}"]`
      );

      if (playerBoards[opponent].has(i)) {
        opponentCell.classList.add("hit");

        playerScores[currentPlayer]++;
        killstreak = true;
        logShot(currentPlayer, i, "hit");

        for (let ship of placedShips[opponent]) {
          if (ship.positions.includes(i)) {
            const allHit = ship.positions.every((pos) => {
              const c = opponentGrid.querySelector(
                `.cell[data-index="${pos}"]`
              );
              return c.classList.contains("hit");
            });

            if (allHit) {
              ship.positions.forEach((pos) => {
                const cell = opponentGrid.querySelector(
                  `.cell[data-index="${pos}"]`
                );
                cell.classList.remove("hit");
                cell.classList.add("sunk");

                const img = cell.querySelector(".ship-image");
                if (img) img.classList.remove("hidden-ship");
              });
              let shipImage = null;
              for (const pos of ship.positions) {
                const cell = opponentGrid.querySelector(
                  `.cell[data-index="${pos}"]`
                );
                const img = cell.querySelector(".ship-image");
                if (img) {
                  shipImage = img;
                  break;
                }
              }
              if (shipImage) {
                const name = shipImage.dataset.name;
                shipImage.src = `./images/ships/${name}_destroyed.svg`;
              }
              logShot(
                currentPlayer,
                i,
                `sunk a ${shipImage?.dataset.name || "ship"}`
              );
            }
            break;
          }
        }

        const totalShipCells = placedShips[opponent].reduce(
          (sum, ship) => sum + ship.size,
          0
        );
        if (playerScores[currentPlayer] === totalShipCells) {
          showVictoryOverlay(currentPlayer);
          cell.classList.remove("hidden-ship");
          removeAllEventListeners();
          return;
        }
      } else {
        opponentCell.classList.add("miss");
        killstreak = false;
        logShot(currentPlayer, i, "miss");
      }

      if (!killstreak) {
        currentPlayer = opponent;
        showTurnOverlay(currentPlayer, () => {
          document.getElementById(
            "turn"
          ).textContent = `Player ${currentPlayer}'s Turn`;
        });
      }
    }
  }

  function isValidPlacement(player, index, size) {
    const occupied = playerBoards[player];
    const direction = vertical ? gridSize : 1;

    for (let i = 0; i < size; i++) {
      const cellIndex = index + i * direction;

      if (!isOnSameRowOrColumn(index, cellIndex)) return false;
      if (occupied.has(cellIndex)) return false;

      const neighbors = getAdjacentCells(cellIndex);
      for (const neighbor of neighbors) {
        if (occupied.has(neighbor)) return false;
      }
    }
    return true;
  }

  function isOnSameRowOrColumn(start, end) {
    if (vertical) {
      return end < gridSize * gridSize;
    } else {
      return Math.floor(start / gridSize) === Math.floor(end / gridSize);
    }
  }

  function getAdjacentCells(index) {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const positions = [];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (
          newRow >= 0 &&
          newRow < gridSize &&
          newCol >= 0 &&
          newCol < gridSize
        ) {
          positions.push(newRow * gridSize + newCol);
        }
      }
    }
    return positions;
  }

  function updateShipDropdown() {
    const dropdown = document.getElementById("shipType");
    Array.from(dropdown.options).forEach((option) => {
      const size = parseInt(option.value);
      option.disabled = shipCounts[currentPlayer][size] >= shipLimits[size];
    });
  }

  function removeAllEventListeners() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.removeEventListener("click", handleCellClick);
    });
  }

  function populateShipyard(playerId) {
    const shipyard = document.getElementById(`player${playerId}-shipyard`);
    const innerShipyard = document.createElement("div");

    innerShipyard.className = "shipyard-ships";

    sizesAndNames.forEach((ship) => {
      const config = sizesAndNames.find(
        (s) => s.size == ship.size && s.name == ship.name
      );
      const shipyardConfig = config?.shipyardConfig || {};
      const shipDiv = document.createElement("div");
      shipDiv.className = "draggable-ship";
      shipDiv.draggable = true;
      shipDiv.dataset.size = ship.size;
      shipDiv.dataset.name = ship.name;

      const img = document.createElement("img");
      img.src = `./images/ships/${ship.name}.svg`;
      img.alt = ship.name;
      img.style.width = shipyardConfig?.width || "200px";
      img.style.height = shipyardConfig?.height || "150px";
      img.style.transform = shipyardConfig.transform || "rotate(90deg)";

      shipDiv.appendChild(img);
      shipyard.appendChild(innerShipyard);
      innerShipyard.appendChild(shipDiv);
    });
  }

  function resetGame() {
    console.log("resetGame() is runnig");
    removeAllEventListeners();
    if (typeof currentMusic !== "undefined" && currentMusic) {
      fadeOutMusic(currentMusic, 0.02);
    }
    document.getElementById("grid1").innerHTML = "";
    document.getElementById("grid2").innerHTML = "";
    document.getElementById("player1-shipyard").innerHTML =
      "<h3>Player 1 Ships</h3>";
    document.getElementById("player2-shipyard").innerHTML =
      "<h3>Player 2 Ships</h3>";

    currentPlayer = 1;
    playerBoards = { 1: new Set(), 2: new Set() };
    playerScores = { 1: 0, 2: 0 };
    placingShips = true;
    placedShips = { 1: [], 2: [] };
    killstreak = false;
    selectedOrientation = "horizontal";
    shipCounts = {
      1: { 5: 0, 4: 0, 3: 0, 2: 0 },
      2: { 5: 0, 4: 0, 3: 0, 2: 0 },
    };

    document.getElementById("shot-log").innerHTML = "";

    document.getElementById("turn").textContent = "Player 1: Place Your Ships";
    document.getElementById("message").textContent = "";

    document.getElementById("deploy-player1").disabled = true;
    document.getElementById("deploy-player2").disabled = true;

    document.getElementById("randomize-player1").disabled = false;
    document.getElementById("randomize-player2").disabled = true;

    document.getElementById("reset-player1-board").disabled = false;
    document.getElementById("reset-player2-board").disabled = true;

    createGrid("grid1", 1);
    createGrid("grid2", 2);

    populateShipyard(1);
    populateShipyard(2);

    setupDraggableShips();
    updateShipDropdown();
    setupDraggableShips();
  }
  document.getElementById("resetGame").addEventListener("click", resetGame);

  // Játékos tábla reset
  function resetPlayerBoard(playerNumber) {
    const grid = document.getElementById(`grid${playerNumber}`);
    const shipyard = document.getElementById(`player${playerNumber}-shipyard`);

    // Csak a játszható táblák resetlése (A cimkék pl.: A, 1 nem értendőek bele)
    const cells = grid.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove("ship", "hit", "miss", "sunk");
      cell.innerHTML = "";
      cell.style.background = "";
    });

    // Változók resetlése
    playerBoards[playerNumber] = new Set();
    shipCounts[playerNumber] = { 5: 0, 4: 0, 3: 0, 2: 0 };
    placedShips[playerNumber] = [];

    // Sipyard reset
    shipyard.innerHTML = `<h3>Player ${playerNumber} Ships</h3>`;
    populateShipyard(playerNumber);
    setupDraggableShips();

    // UI reset
    if (currentPlayer === playerNumber) {
      updateShipDropdown();
      document.getElementById(
        "turn"
      ).textContent = `Player ${playerNumber}: Place Your Ships`;
      document.getElementById("message").textContent = "";
    }
  }

  document
    .getElementById("reset-player1-board")
    .addEventListener("click", () => resetPlayerBoard(1));
  document
    .getElementById("reset-player2-board")
    .addEventListener("click", () => resetPlayerBoard(2));

  // Játékos tábla randomizálása
  function randomizeShips(player) {
    resetPlayerBoard(player);

    const grid = document.getElementById(`grid${player}`);
    const occupied = playerBoards[player];

    for (let ship of sizesAndNames) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 1000) {
        vertical = Math.random() < 0.5;

        const startIndex = Math.floor(Math.random() * gridSize * gridSize);

        if (isValidPlacement(player, startIndex, ship.size)) {
          let cellsUsed = [];

          for (let j = 0; j < ship.size; j++) {
            const offset = vertical ? j * gridSize : j;
            const cellIndex = startIndex + offset;
            const cell = grid.querySelector(`.cell[data-index="${cellIndex}"]`);
            cell.classList.add("ship");
            occupied.add(cellIndex);
            cellsUsed.push(cellIndex);
          }

          placedShips[player].push({
            size: ship.size,
            positions: cellsUsed,
          });

          shipCounts[player][ship.size]++;
          addShipImage(
            `grid${player}`,
            startIndex,
            ship.size,
            vertical ? "vertical" : "horizontal",
            `./images/ships/${ship.name}.svg`,
            ship.name
          );
          removePlacedShipFromSelection(ship.size);

          placed = true;
        }

        attempts++;
      }

      if (!placed) {
        console.warn(`Failed to place ship: ${ship.name}`);
      }
    }

    checkShipPlacementComplete();
  }

  document
    .getElementById("randomize-player1")
    .addEventListener("click", () => randomizeShips(1));
  document
    .getElementById("randomize-player2")
    .addEventListener("click", () => randomizeShips(2));

  // Hajóképke ráillesztése
  function addShipImage(gridId, index, size, orientation, src, name) {
    const grid = document.getElementById(gridId);
    const cell = grid.querySelector(`.cell[data-index='${index}']`);
    if (!cell) {
      console.error("Cell not found for index", index);
      return;
    }

    const shipImage = document.createElement("img");
    shipImage.src = src;
    shipImage.classList.add("ship-image");

    shipImage.dataset.name = name;
    shipImage.dataset.index = index;
    shipImage.dataset.orientation = orientation;

    shipImage.style.position = "absolute";
    shipImage.style.pointerEvents = "none";
    shipImage.style.top = "0";
    shipImage.style.left = "0";

    const config = sizesAndNames.find((s) => s.size === size && s.name == name);

    if (orientation === "horizontal") {
      shipImage.style.width = config?.width || "400px";
      shipImage.style.height = config?.height || "300px";
      shipImage.style.transform = `rotate(90deg) ${
        config?.horizontalTransform || ""
      }`;
    } else {
      shipImage.style.width = config?.width || "400px";
      shipImage.style.height = config?.height || "300px";
      shipImage.style.transform = `rotate(0deg) ${
        config?.verticalTransform || ""
      }`;
    }
    shipImage.style.transformOrigin = "top left";

    cell.style.position = "relative";
    cell.appendChild(shipImage);
  }

  function checkShipPlacementComplete() {
    const totalPlaced = placedShips[currentPlayer].reduce(
      (sum, ship) => sum + ship.size,
      0
    );
    const totalRequired = Object.entries(shipLimits).reduce(
      (sum, [size, count]) => sum + size * count,
      0
    );

    const deployBtn = document.getElementById(`deploy-player${currentPlayer}`);
    if (totalPlaced === totalRequired) {
      deployBtn.disabled = false;
    } else {
      deployBtn.disabled = true;
    }
  }

  document.getElementById("deploy-player1").addEventListener("click", () => {
    handleDeploy(1);
  });
  document.getElementById("deploy-player2").addEventListener("click", () => {
    handleDeploy(2);
  });

  function handleDeploy(player) {
    document.getElementById(`deploy-player${player}`).disabled = true;
    document.getElementById(`randomize-player${player}`).disabled = true;
    document.getElementById(`reset-player${player}-board`).disabled = true;

    hidePlayerShips(player);

    if (player === 1) {
      currentPlayer = 2;
      updateShipDropdown();

      document.getElementById(
        "turn"
      ).textContent = `Player 2: Place Your Ships`;
      document.getElementById("message").textContent = "";

      document.getElementById("deploy-player2").disabled = true;
      document.getElementById("randomize-player2").disabled = false;
      document.getElementById("reset-player2-board").disabled = false;

      checkShipPlacementComplete();
    } else {
      placingShips = false;

      document.getElementById("randomize-player1").disabled = true;
      document.getElementById("randomize-player2").disabled = true;
      document.getElementById("reset-player1-board").disabled = true;
      document.getElementById("reset-player2-board").disabled = true;
      document.getElementById("deploy-player1").disabled = true;
      document.getElementById("deploy-player2").disabled = true;

      showStartOverlay(() => {
        showTurnOverlay(currentPlayer, () => {
          document.getElementById(
            "turn"
          ).textContent = `Player ${currentPlayer}'s Turn`;
        });
      });
    }
  }

  // Az ellenfél táblájának elrejtése
  function hidePlayerShips(player) {
    const grid = document.getElementById(`grid${player}`);
    const cells = grid.querySelectorAll(".cell");
    const images = grid.querySelectorAll(".ship-image");

    cells.forEach((cell) => {
      if (cell.classList.contains("ship")) {
        cell.classList.add("hidden-ship");
      }
    });

    images.forEach((img) => {
      const parentCell = img.closest(".cell");
      if (parentCell && parentCell.dataset.player == player) {
        img.classList.add("hidden-ship");
      }
    });
  }

  // Találatok logolása
  function logShot(player, cellIndex, result) {
    const node = document.createElement("li");
    const textnode = document.createTextNode(
      "Player " +
        player +
        " shot at " +
        indexToCordinates(cellIndex) +
        " - " +
        result
    );
    node.appendChild(textnode);

    const l = document.getElementById("shot-log");
    l.insertBefore(node, l.children[0]);
    if (l.children[1].innerText == "") l.removeChild(l.children[1]);

    console.log(indexToCordinates(cellIndex));
  }

  // Az index értékek "kordinátákká való alakítása"
  function indexToCordinates(index) {
    /*
            Alakítsd át az indexet
                Kell sor, oszlop meg a betű
                A sor számításnál oszd el az indexet a tábla méretével (gridSize), kerekítsd
                Az oszlopnál oszd el az indexet a tábla méretével maradékosan
                A betűnél használd a String.fromCharCode()-ot ez egy Unicode kód alapján add vissza egy karaktert. A = 65 + 0, B = 65 + 1, ... (a + 1-nél a sor számát írd)
        */
    const cordn = Math.ceil(index / gridSize);

    const cordL = index % gridSize;
    if (String.fromCharCode(65 + cordL) != "A")
      return String.fromCharCode(65 + cordL) + cordn;
    return String.fromCharCode(65 + cordL) + (cordn + 1);
  }

  populateShipyard(1);
  populateShipyard(2);
  createGrid("grid1", 1);
  createGrid("grid2", 2);
  setupDraggableShips();
});

function showStartOverlay(callback) {
  const overlay = document.getElementById("startOverlay");
  const messageElement = document.getElementById("startMessage");
  const messageText = "🚢 Let the battle begin! 🚢";

  overlay.classList.add("visible");
  messageElement.textContent = "";

  let index = 0;
  const typingSpeed = 50;

  function typeLetter() {
    if (index < messageText.length) {
      messageElement.textContent += messageText.charAt(index);
      index++;
      setTimeout(typeLetter, typingSpeed);
    } else {
      setTimeout(() => {
        overlay.classList.remove("visible");
        if (typeof callback === "function") callback();
      }, 1000);
    }
  }

  typeLetter();
}

function showStartOverlay(callback) {
  playMusic("./audio/battle.mp3", {
    loopStart: 3,
    loopEnd: 41.28,
    volume: 0.5,
  });
  const overlay = document.getElementById("startOverlay");
  const messageElement = document.getElementById("startMessage");
  const messageText = "🚢 Let the battle begin! 🚢";

  overlay.classList.add("visible");
  overlay.classList.remove("hidden");
  messageElement.textContent = "";

  let index = 0;
  const typingSpeed = 50;

  function typeLetter() {
    if (index < messageText.length) {
      messageElement.textContent += messageText.charAt(index);
      index++;
      setTimeout(typeLetter, typingSpeed);
    } else {
      setTimeout(() => {
        overlay.classList.remove("visible");
        overlay.classList.add("hidden");
        if (typeof callback === "function") callback();
      }, 1200);
    }
  }

  typeLetter();
}

const turnMessages = [
  "🎯 Locking target...",
  "🧭 Scanning for enemy vessels...",
  "🔄 Switching command...",
  "💣 Ready to fire!",
  "📡 Establishing coordinates...",
  "🛰️ Tactical systems online...",
  "🛳️ Awaiting firing order...",
  "⚓ Enemy in sight!",
  "🎛️ Systems recalibrating...",
  "🧨 Engaging battle protocol...",
];

function showTurnOverlay(player, callback) {
  const overlay = document.getElementById("turnOverlay");
  const message = document.getElementById("turnMessage");
  const randomMessage = Math.floor(Math.random() * turnMessages.length);
  const isMessage = Math.floor(Math.random() * (10 - 1) + 0) > 5 ? true : false;
  console.log(isMessage);
  const text = `🎯 Player ${player}'s Turn ${
    isMessage ? turnMessages[randomMessage] : ""
  }`;

  message.textContent = "";
  overlay.classList.add("visible");
  overlay.classList.remove("hidden");

  let index = 0;
  const typingSpeed = 40;

  function typeNext() {
    if (index < text.length) {
      message.textContent += text.charAt(index);
      index++;
      setTimeout(typeNext, typingSpeed);
    } else {
      setTimeout(() => {
        overlay.classList.remove("visible");
        overlay.classList.add("hidden");
        if (typeof callback === "function") callback();
      }, 1000);
    }
  }

  typeNext();
}

function showVictoryOverlay(player) {
  const overlay = document.getElementById("victoryOverlay");
  const message = document.getElementById("victoryMessage");

  fadeOutMusic(currentMusic, 0.5, () => {
    playMusic("./audio/victory.mp3");
  });

  message.textContent = `🎉 Player ${player} Wins! 🎉`;
  overlay.classList.add("visible");
}
