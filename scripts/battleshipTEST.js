
document.addEventListener('DOMContentLoaded', () => {

// Hajó típusok
const shipLimits = {
    5: 1, // Carrier
    4: 1, // Battleship
    3: 2, // Submarine
    2: 2  // Destroyer
};

let shipCounts = {
    1: { 5: 0, 4: 0, 3: 0, 2: 0 },
    2: { 5: 0, 4: 0, 3: 0, 2: 0 }
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

// A hajók elforgatása (kiírás)
let forcePreviewUpdate = false;
let isDragging = false;

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
        vertical = !vertical;
        document.getElementById("message").textContent = `Rotation: ${vertical ? "Vertical" : "Horizontal"}`;

        if (isDragging && currentDragCell) {
            removeDragPreview();
            showDragPreview(currentDragCell, draggedShipSize);
        }
    }
});

let currentDragCell = null;

// Táblák generálása
function createGrid(gridId, player) {
    const grid = document.getElementById(gridId);
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.dataset.player = player;
        cell.addEventListener("click", handleCellClick);

        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            cell.classList.add('drag-over');
        
            if (currentDragCell !== cell || forcePreviewUpdate) {
                currentDragCell = cell;
                removeDragPreview();
                showDragPreview(cell, draggedShipSize);
                forcePreviewUpdate = false;
            }
        });
        

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over');
            removeDragPreview();
            currentDragCell = null;
        });

        cell.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!placingShips || !draggedShipSize || !isDragging) return;
        
            const player = parseInt(cell.dataset.player);
            const index = parseInt(cell.dataset.index);
        
            if (player !== draggingPlayer) {
                document.getElementById("message").textContent = "You must place ships on your own board!";
                return;
            }
        
            if (isValidPlacement(player, index, draggedShipSize)) {
                placeShip(player, index, draggedShipSize);
                removeDragPreview();
                isDragging = false;
                draggedShipSize = null;
            }
        });
        

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            removeDragPreview();
            currentDragCell = null;

            const size = parseInt(e.dataTransfer.getData('shipSize'));
            const shipName = e.dataTransfer.getData('shipName');

            const index = parseInt(cell.dataset.index);
            const player = parseInt(cell.dataset.player);

            if (placingShips && currentPlayer === player) {
                if (shipCounts[player][size] < shipLimits[size] && isValidPlacement(player, index, size)) {
                    for (let j = 0; j < size; j++) {
                        const offset = vertical ? j * gridSize : j;
                        const shipCell = grid.children[index + offset];
                        shipCell.classList.add('ship');
                        playerBoards[player].add(index + offset);
                    }

                    addShipImage(`grid${player}`, index, size, vertical ? 'vertical' : 'horizontal', `./images/ships/${shipName}.png`);

                    shipCounts[player][size]++;
                    placedShips[player].push(size);
                    updateShipDropdown();
                    removePlacedShipFromSelection(size);

                    if (placedShips[1].length >= 6 && placedShips[2].length >= 6) {
                        placingShips = false;
                        document.getElementById("turn").textContent = `Player ${currentPlayer = currentPlayer === 1 ? 2 : 1}'s Turn`;
                    } else {
                        if (placedShips[currentPlayer].length >= 6) {
                            currentPlayer = currentPlayer === 1 ? 2 : 1;
                            updateShipDropdown();
                        }
                        document.getElementById("turn").textContent = `Player ${currentPlayer}: Place Your Ships`;
                    }
                } else {
                    cell.classList.add("invalid-drop");
                    setTimeout(() => cell.classList.remove("invalid-drop"), 500);
                }
            }
        });

        grid.appendChild(cell);
    }
}

let draggingPlayer = null;

function setupDraggableShips() {
    document.querySelectorAll('.draggable-ship').forEach(ship => {

        ship.addEventListener("dragstart", (e) => {
            isDragging = true;
            draggedShipSize = parseInt(e.target.dataset.size);
            e.dataTransfer.setData('shipSize', ship.dataset.size);
            e.dataTransfer.setData('shipName', ship.dataset.name);
            
            // ➡️ New: detect which shipyard
            if (e.target.closest("#player1-shipyard")) {
                draggingPlayer = 1;
            } else if (e.target.closest("#player2-shipyard")) {
                draggingPlayer = 2;
            }

            document.getElementById("message").textContent = "Dragging ship of size " + draggedShipSize;
        });
        ship.addEventListener('dragend', (e) => {
            isDragging = false;
            removeDragPreview();
        });
    });
}


function removePlacedShipFromSelection(size) {
    const ship = document.querySelector(`.draggable-ship[data-size='${size}']`);
    if (ship) ship.remove();
}

function showDragPreview(cell, size) {
    removeDragPreview();
    if (!placingShips || !draggedShipSize || !cell) return;
    const grid = cell.parentElement;
    const index = parseInt(cell.dataset.index);
    const player = parseInt(cell.dataset.player);

    dragPreview = document.createElement('div');
    dragPreview.classList.add('drag-preview');
    const cellSize = 55;
    dragPreview.style.width = vertical ? `${cellSize}px` : `${cellSize * size}px`;
    dragPreview.style.height = vertical ? `${cellSize * size}px` : `${cellSize}px`;
    dragPreview.style.position = 'absolute';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    if (!isValidPlacement(player, index, size)) {
        dragPreview.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
    }    
    dragPreview.style.top = `${Math.floor(index / gridSize) * cellSize}px`;
    dragPreview.style.left = `${(index % gridSize) * cellSize}px`;

    grid.parentElement.appendChild(dragPreview);
}


function updateDragPreviewOrientation() {
    if (!dragPreview || !draggedShipSize) return;
    const cellSize = 55;
    dragPreview.style.width = vertical ? `${cellSize}px` : `${cellSize * draggedShipSize}px`;
    dragPreview.style.height = vertical ? `${cellSize * draggedShipSize}px` : `${cellSize}px`;
}

function removeDragPreview() {
    if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
    }
}
    
function handleCellClick(event) {
    const cell = event.target;
    const grid = cell.parentElement;
    const i = parseInt(cell.dataset.index);
    const player = parseInt(cell.dataset.player);

    if (placingShips) {
        let shipSize = parseInt(document.getElementById("shipType").value);
        if (currentPlayer === player && shipCounts[player][shipSize] < shipLimits[shipSize] && isValidPlacement(player, i, shipSize)) {
            for (let j = 0; j < shipSize; j++) {
                let offset = vertical ? j * gridSize : j;
                let shipCell = grid.children[i + offset];
                shipCell.classList.add("ship");
                playerBoards[player].add(i + offset);
            }
            shipCounts[player][shipSize]++;
            placedShips[player].push(shipSize);
            updateShipDropdown();

            if (placedShips[1].length >= 6 && placedShips[2].length >= 6) {
                placingShips = false;
                document.getElementById("turn").textContent = `Player ${currentPlayer = currentPlayer === 1 ? 2 : 1}'s Turn`;
            } else {
                if(placedShips[currentPlayer].length >= 6) {
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateShipDropdown();
                } else return;
                document.getElementById("turn").textContent = `Player ${currentPlayer}: Place Your Ships`;
            }
        }
    } else {
        if (player === currentPlayer || cell.classList.contains("hit") || cell.classList.contains("miss")) return;

        let opponent = currentPlayer === 1 ? 2 : 1;
        let opponentGrid = document.getElementById(`grid${opponent}`);
        let opponentCell = opponentGrid.children[i];

        if (playerBoards[opponent].has(i)) {
            opponentCell.classList.add("hit");
            playerScores[currentPlayer]++;
            killstreak = true;
            logShot(currentPlayer, i, "hit");
            if (playerScores[currentPlayer] === placedShips[opponent].reduce((a, b) => a + b, 0)) {
                document.getElementById("message").textContent = `Player ${currentPlayer} wins!`;
                removeAllEventListeners();
                return;
            }
        } else {
            opponentCell.classList.add("miss");
            killstreak = false;
            logShot(currentPlayer, i, "miss");
        }

        if (!killstreak) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
        document.getElementById("turn").textContent = `Player ${currentPlayer}'s Turn`;
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
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                positions.push(newRow * gridSize + newCol);
            }
        }
    }
    return positions;
}

function updateShipDropdown() {
    const dropdown = document.getElementById("shipType");
    Array.from(dropdown.options).forEach(option => {
        const size = parseInt(option.value);
        option.disabled = shipCounts[currentPlayer][size] >= shipLimits[size];
    });
}

function removeAllEventListeners() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.removeEventListener("click", handleCellClick);
    });
}

function populateShipyard(playerId) {
    const shipyard = document.getElementById(`player${playerId}-shipyard`);
    const ships = [
        { size: 5, name: 'carrier' },
        { size: 4, name: 'battleship' },
        { size: 3, name: 'submarine' },
        { size: 3, name: 'submarine' },
        { size: 2, name: 'destroyer' },
        { size: 2, name: 'destroyer' }
    ];

    ships.forEach(ship => {
        const shipDiv = document.createElement('div');
        shipDiv.className = 'draggable-ship';
        shipDiv.draggable = true;
        shipDiv.dataset.size = ship.size;
        shipDiv.dataset.name = ship.name;

        const img = document.createElement('img');
        img.src = `./images/ships/${ship.name}.png`; // <-- Majd ha kész a hajó változtasd meg a LINKET és a FORMÁTUMOT!
        img.alt = ship.name;
        img.style.width = `${ship.size * 55}px`;
        img.style.height = `55px`;

        shipDiv.appendChild(img);
        shipyard.appendChild(shipDiv);
    });
}

// Még mindig nincs kész :(
function resetGame() {
    removeAllEventListeners();
    document.getElementById('grid1').innerHTML = '';
    document.getElementById('grid2').innerHTML = '';
    document.getElementById('player1-shipyard').innerHTML = '<h3>Player 1 Ships</h3>';
    document.getElementById('player2-shipyard').innerHTML = '<h3>Player 2 Ships</h3>';

    currentPlayer = 1;
    playerBoards = { 1: new Set(), 2: new Set() };
    playerScores = { 1: 0, 2: 0 };
    placingShips = true;
    placedShips = { 1: [], 2: [] };
    killstreak = false;
    selectedOrientation = 'horizontal';
    shipCounts = {
        1: { 5: 0, 4: 0, 3: 0, 2: 0 },
        2: { 5: 0, 4: 0, 3: 0, 2: 0 }
    };

    // Találat logolás resetelése (Ha kész a shotLog függvény töröld a kommentet!)
    //document.getElementById("shotLog").innerHTML = "";

    document.getElementById("turn").textContent = "Player 1: Place Your Ships";
    document.getElementById("message").textContent = "";

    createGrid("grid1", 1);
    createGrid("grid2", 2);

    populateShipyard(1);
    populateShipyard(2);

    setupDraggableShips();
    updateShipDropdown();
    setupDraggableShips();
}
document.getElementById("resetGame").addEventListener("click", resetGame);

// Hajóképke ráillesztése
function addShipImage(gridId, index, size, orientation, src) {
    const grid = document.getElementById(gridId);
    const cell = grid.children[index];

    const shipImage = document.createElement('img');
    shipImage.src = src;
    shipImage.classList.add('ship-image');

    shipImage.style.position = 'absolute';
    shipImage.style.pointerEvents = 'none';
    shipImage.style.top = '0';
    shipImage.style.left = '0';

    const cellSize = cell.offsetWidth;

    if (orientation === 'horizontal') {
        shipImage.style.width = `${cellSize * size}px`;
        shipImage.style.height = `${cellSize}px`;
        shipImage.style.transform = 'rotate(0deg)';
        shipImage.style.transformOrigin = 'top left';
    } else {
        shipImage.style.width = `${cellSize * size}px`;
        shipImage.style.height = `${cellSize}px`;
        shipImage.style.transform = 'rotate(90deg)';
        shipImage.style.transformOrigin = 'top left';
        shipImage.style.transform += ` translate(0, -50px)`;
    }

    cell.style.position = 'relative'; 
    cell.appendChild(shipImage);
}

// Találatok logolása
function logShot(player, cellIndex, result) {
    /*
        Player 1 shot at B4 – HIT (A cella megjelenításe)
    */
}

function indexToCordinates(index) {
    /*
        Alakítsd át az indexet
            Kell sor, oszlop meg a betű
            A sor számításnál oszd el az indexet a tábla méretével (gridSize), kerekítsd
            Az oszlopnál oszd el az indexet a tábla méretével maradékosan
            A betűnél használd a String.fromCharCode()-ot ez egy Unicode kód alapján add vissza egy karaktert. A = 65 + 0, B = 65 + 1, ... (a + 1-nél a sor számát írd)
    */
}

createGrid("grid1", 1);
createGrid("grid2", 2);
setupDraggableShips();

});