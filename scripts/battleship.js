document.addEventListener('DOMContentLoaded', () => {


// Hajó típusok
const shipLimits = {
    5: 1, // Carrier
    4: 1, // Battleship
    3: 2, // Submarine
    2: 2  // Destroyer
};

// Hajó típusok számának követése
let shipCounts = {
    1: { 5: 0, 4: 0, 3: 0, 2: 0 },
    2: { 5: 0, 4: 0, 3: 0, 2: 0 }
};


const gridSize = 10;
let currentPlayer = 1;
let playerBoards = { 1: new Set(), 2: new Set() }; // Játékos táblák
let playerScores = { 1: 0, 2: 0 }; // Játékos pontok
let placingShips = true;
let placedShips = { 1: [], 2: [] }; // Lerakot hajók 
let killstreak = false;
let vertical = false;

// A hajók elforgatása (kiírás)
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
        vertical = !vertical;
        document.getElementById("message").textContent = `Rotation: ${vertical ? "Vertical" : "Horizontal"}`;
    }
});

// A táblák generálása
function createGrid(gridId, player) {
    const grid = document.getElementById(gridId);
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.dataset.player = player;
        cell.addEventListener("click", handleCellClick);

        // Cellák generálása
        grid.appendChild(cell);
    }
}

// Játék logika
function handleCellClick(event) {
    const cell = event.target;
    const grid = cell.parentElement;
    const i = parseInt(cell.dataset.index);
    const player = parseInt(cell.dataset.player);

    if (placingShips) {
        let shipSize = parseInt(document.getElementById("shipType").value);
        if (currentPlayer === player && shipCounts[player][shipSize] < shipLimits[shipSize] && isValidPlacement(player, i, shipSize)) {
            
            // Hajó lehelyezése
            for (let j = 0; j < shipSize; j++) {
                let offset = vertical ? j * gridSize : j;
                let shipCell = grid.children[i + offset];
                shipCell.classList.add("ship");
                playerBoards[player].add(i + offset);
            }
            shipCounts[player][shipSize]++;
            placedShips[player].push(shipSize);
            updateShipDropdown();
            
            // Meccs megkezdése és/vagy játékos váltása (mecss)
            if (placedShips[1].length >= 6 && placedShips[2].length >= 6) {
                placingShips = false;
                document.getElementById("turn").textContent = `Player ${currentPlayer = currentPlayer === 1 ? 2 : 1}'s Turn`;
            } else { // Játékos váltás (hajó lehelyezés)
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
            logShot(currentPlayer, i, "hit"); // Találat logolás
            if (playerScores[currentPlayer] === placedShips[opponent].reduce((a, b) => a + b, 0)) {
                document.getElementById("message").textContent = `Player ${currentPlayer} wins!`;
                removeAllEventListeners();
                return;
            }
        } else {
            opponentCell.classList.add("miss");
            killstreak = false;
            logShot(currentPlayer, i, "miss"); // Találat logolás
        }

        if (!killstreak) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
        document.getElementById("turn").textContent = `Player ${currentPlayer}'s Turn`;
    }
}


// A hajók lerakásának ellenőrzése
function isValidPlacement(player, index, size) {
    const occupied = playerBoards[player];
    const direction = vertical ? gridSize : 1;

    for (let i = 0; i < size; i++) {
        const cellIndex = index + i * direction;

        // Egymásra csúszás ellenőrzése
        if (!isOnSameRowOrColumn(index, cellIndex)) return false;

        // Már folalt cellák ellenőrzése
        if (occupied.has(cellIndex)) return false;

        // Szomszédos cellák ellenőrzése
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
                newRow >= 0 && newRow < gridSize &&
                newCol >= 0 && newCol < gridSize
            ) {
                positions.push(newRow * gridSize + newCol);
            }
        }
    }
    return positions;
}

// A hajó lista frissítése, ha egy adott hajótípusból eléri a maximumot akkor nem tudjuk kiválasztani (<select>) 
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

// Még nincs kész :( 
function resetGame() {

    removeAllEventListeners();

    // Táblák tartalmának törlése
    document.getElementById('grid1').innerHTML = '';
    document.getElementById('grid2').innerHTML = '';
    
    // Változók resetelése
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

    // UI resetelése
    document.getElementById("turn").textContent = "Player 1: Place Your Ships";
    document.getElementById("message").textContent = "";

    // A táblák újra generálása
    createGrid("grid1", 1);
    createGrid("grid2", 2);
    updateShipDropdown();
}
document.getElementById("resetGame").addEventListener("click", resetGame);

// Még nincs kész :(
function addShipImage(gridId, index, size, orientation, imageUrl) {
    const grid = document.getElementById(gridId);
    const gridWrapper = grid.parentElement;

    const cell = grid.children[index];
    const rect = cell.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();

    const shipDiv = document.createElement('div');
    shipDiv.className = 'ship-image';
    shipDiv.style.backgroundImage = `url(${imageUrl})`;

    const cellSize = 50 + 5; // cell size + gap (adjust to match CSS)

    shipDiv.style.width = orientation === 'horizontal' ? `${cellSize * size}px` : `${cellSize}px`;
    shipDiv.style.height = orientation === 'horizontal' ? `${cellSize}px` : `${cellSize * size}px`;

    shipDiv.style.left = `${(index % gridSize) * cellSize}px`;
    shipDiv.style.top = `${Math.floor(index / gridSize) * cellSize}px`;

    if (orientation === 'vertical') {
        shipDiv.style.transform = 'rotate(90deg)';
        shipDiv.style.transformOrigin = 'top left';
    }

    gridWrapper.appendChild(shipDiv);
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

// Táblák generálása
createGrid("grid1", 1);
createGrid("grid2", 2);
});