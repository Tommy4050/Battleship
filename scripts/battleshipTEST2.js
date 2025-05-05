document.addEventListener('DOMContentLoaded', () => {

    // Hajó típusok
    const shipLimits = {
        5: 1, // Carrier
        4: 1, // Battleship
        3: 5, // Submarine & cruser
        2: 3,  // Destroyer
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
    


    let targetIndex = 0;
    let targetPlayer = null;

    
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
                    cell.classList.remove('drag-over');
                    removeDragPreview();
                    currentDragCell = null;
    
                    const size = parseInt(e.dataTransfer.getData('shipSize'));
                    const shipName = e.dataTransfer.getData('shipName');
    
                    const dropIndex = parseInt(cell.dataset.index);
                    const dropPlayer = parseInt(cell.dataset.player);
    
                    if (placingShips && currentPlayer === dropPlayer) {
                        if (shipCounts[dropPlayer][size] < shipLimits[size] && isValidPlacement(dropPlayer, dropIndex, size)) {
                            let cellsUsed = [];
    
                            for (let j = 0; j < size; j++) {
                                const offset = vertical ? j * gridSize : j;
                                const shipCellIndex = dropIndex + offset;
                                const shipCell = wrapper.querySelector(`[data-index='${shipCellIndex}']`);
                                shipCell.classList.add('ship');
                                playerBoards[dropPlayer].add(shipCellIndex);
                                cellsUsed.push(shipCellIndex);
                            }
    
                            placedShips[dropPlayer].push({
                                size: size,
                                positions: cellsUsed
                            });
    
                            checkShipPlacementComplete();
    
                            addShipImage(`grid${dropPlayer}`, dropIndex, size, vertical ? 'vertical' : 'horizontal', `./images/ships/${shipName}.svg`, shipName);
    
                            shipCounts[dropPlayer][size]++;
                            updateShipDropdown();
                            removePlacedShipFromSelection(size);
    
                            if (placedShips[1].length >= 10 && placedShips[2].length >= 10) {
                                placingShips = false;
                                document.getElementById("turn").textContent = `Player ${currentPlayer = currentPlayer === 1 ? 2 : 1}'s Turn`;
                                document.getElementById('reset-player1-board').disabled = true;
                                document.getElementById('reset-player2-board').disabled = true;
                            } else {
                                if (placedShips[currentPlayer].length >= 10) {
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
    
                wrapper.appendChild(cell);
            }
        }
    
        grid.appendChild(wrapper);
    }
    
    let draggingPlayer = null;
    
    function setupDraggableShips() {
        document.querySelectorAll('.draggable-ship').forEach(ship => {
            
            ship.addEventListener("dragstart", (e) => {
                isDragging = true;
                draggedShipSize = ship.dataset.size;
                e.dataTransfer.setData('shipSize', ship.dataset.size);
                e.dataTransfer.setData('shipName', ship.dataset.name);
                
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
    
        dragPreview = document.createElement('div');
        dragPreview.classList.add('drag-preview');
        dragPreview.style.width = vertical ? `${cellSize}px` : `${cellSize * size}px`;
        dragPreview.style.height = vertical ? `${cellSize * size}px` : `${cellSize}px`;
        dragPreview.style.position = 'absolute';
        dragPreview.style.pointerEvents = 'none';
        dragPreview.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    
        if (!isValidPlacement(player, index, size)) {
            dragPreview.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
        }
    
        dragPreview.style.top = `${top}px`;
        dragPreview.style.left = `${left}px`;
    
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
        if (!cell.classList.contains('cell')) return; // A cimkékre való klikkelés ignorálása
    
        const grid = cell.parentElement;
        const i = parseInt(cell.dataset.index);
        const player = parseInt(cell.dataset.player);
    
        if (placingShips) {
            const shipSize = parseInt(document.getElementById("shipType").value);
    
            if (currentPlayer === player && shipCounts[player][shipSize] < shipLimits[shipSize] && isValidPlacement(player, i, shipSize)) {
                let cellsUsed = [];
    
                for (let j = 0; j < shipSize; j++) {
                    const offset = vertical ? j * gridSize : j;
                    const shipCellIndex = i + offset;
                    const shipCell = grid.querySelector(`.cell[data-index="${shipCellIndex}"]`);
    
                    shipCell.classList.add('ship');
                    playerBoards[player].add(shipCellIndex);
                    cellsUsed.push(shipCellIndex);
                }
    
                placedShips[player].push({
                    size: shipSize,
                    positions: cellsUsed
                });
    
                shipCounts[player][shipSize]++;
                updateShipDropdown();
                removePlacedShipFromSelection(shipSize);
                checkShipPlacementComplete();
    
                if (placedShips[1].length >= 10 && placedShips[2].length >= 10) {
                    placingShips = false;
                    document.getElementById("turn").textContent = `Player ${currentPlayer = currentPlayer === 1 ? 2 : 1}'s Turn`;
                } else {
                    if (placedShips[currentPlayer].length >= 10) {
                        updateShipDropdown();
                    }
                    document.getElementById("turn").textContent = `Player ${currentPlayer}: Place Your Ships`;
                }
            }
        } else {
            const opponent = currentPlayer === 1 ? 2 : 1;
    
            if (player !== opponent || cell.classList.contains("hit") || cell.classList.contains("miss")) return;
    
            const opponentGrid = document.getElementById(`grid${opponent}`);
            const opponentCell = opponentGrid.querySelector(`.cell[data-index="${i}"]`);
    
            if (playerBoards[opponent].has(i)) {
                opponentCell.classList.add("hit");
                playerScores[currentPlayer]++;
                killstreak = true;
                logShot(currentPlayer, i, "hit");
    
                for (let ship of placedShips[opponent]) {
                    if (ship.positions.includes(i)) {
                        const allHit = ship.positions.every(pos => {
                            const c = opponentGrid.querySelector(`.cell[data-index="${pos}"]`);
                            return c.classList.contains('hit');
                        });
    
                        if (allHit) {
                            ship.positions.forEach(pos => {
                                const c = opponentGrid.querySelector(`.cell[data-index="${pos}"]`);
                                c.classList.remove('hit');
                                c.classList.add('sunk');
                            });
    
                            const shipImage = opponentGrid.querySelector(
                                `.ship-image[data-index="${ship.positions[0]}"]`
                            );
    
                            if (shipImage) {
                                const name = shipImage.dataset.name;
                                shipImage.src = `./images/ships/${name}_destroyed.svg`;
                            }
                        }
    
                        break;
                    }
                }
    
                const totalShipCells = placedShips[opponent].reduce((sum, ship) => sum + ship.size, 0);
                if (playerScores[currentPlayer] === totalShipCells) {
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
                currentPlayer = opponent;
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
        const innerShipyard = document.createElement('div');
        
        innerShipyard.className = 'shipyard-ships';
    
        const ships = [
            { size: 5, name: 'carrier' },
            { size: 4, name: 'battleship' },
            { size: 3, name: 'cruser' },
            { size: 3, name: 'cruser' },
            { size: 3, name: 'submarine' },
            { size: 3, name: 'submarine' },
            { size: 3, name: 'submarine' },
            { size: 2, name: 'destroyer' },
            { size: 2, name: 'destroyer' },
            { size: 2, name: 'destroyer' },
        ];
    
        ships.forEach(ship => {
            const shipDiv = document.createElement('div');
            shipDiv.className = 'draggable-ship';
            shipDiv.draggable = true;
            shipDiv.dataset.size = ship.size;
            shipDiv.dataset.name = ship.name;
    
            const img = document.createElement('img');
            img.src = `./images/ships/${ship.name}.svg`;
            img.alt = ship.name;
            img.style.width = `200px`;
            img.style.height = `150px`;
            img.style.transform = `rotate(90deg)`;
            img.style.transform += `translate(-50px, 50px)`
    
            shipDiv.appendChild(img);
            shipyard.appendChild(innerShipyard);
            innerShipyard.appendChild(shipDiv);
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

        document.getElementById("deployButton").disabled = true;
        document.getElementById("deployButton").style.display = "inline-block";

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
        const cells = grid.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove("ship", "hit", "miss", "sunk");
            cell.innerHTML = '';
            cell.style.background = '';
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
            document.getElementById("turn").textContent = `Player ${playerNumber}: Place Your Ships`;
            document.getElementById("message").textContent = "";
        }
    }
    
    document.getElementById("reset-player1-board").addEventListener("click", () => resetPlayerBoard(1));
    document.getElementById("reset-player2-board").addEventListener("click", () => resetPlayerBoard(2));
    
    
    // Hajóképke ráillesztése
    function addShipImage(gridId, index, size, orientation, src, name) {
        const grid = document.getElementById(gridId);
        const cell = grid.querySelector(`.cell[data-index='${index}']`);
        if (!cell) {
            console.error("Cell not found for index", index);
            return;
        }
    
        const shipImage = document.createElement('img');
        shipImage.src = src;
        shipImage.classList.add('ship-image');
    
        shipImage.dataset.name = name;
        shipImage.dataset.index = index;
        shipImage.dataset.orientation = orientation;
    
        shipImage.style.position = 'absolute';
        shipImage.style.pointerEvents = 'none';
        shipImage.style.top = '0';
        shipImage.style.left = '0';
    
        if (orientation === 'horizontal') {
            shipImage.style.width = `${400}px`;
            shipImage.style.height = `${300}px`;
            shipImage.style.transform = 'rotate(90deg)';
            shipImage.style.transformOrigin = 'top left';
            shipImage.style.transform += addShipImageHelper(size, orientation, name);
        } else {
            shipImage.style.width = `${400}px`;
            shipImage.style.height = `${300}px`;
            shipImage.style.transform = 'rotate(0deg)';
            shipImage.style.transformOrigin = 'top left';
            shipImage.style.transform += addShipImageHelper(size, orientation, name);
        }
    
        cell.style.position = 'relative'; 
        cell.appendChild(shipImage);
    }
    
    // Az AddShipImage segéd függvénye segít a mértezésben orientáció szerint
    function addShipImageHelper(size, orientation, name) {
        if(orientation === 'horizontal') {
            switch(size && name) {
                case 2 && 'destroyer':
                    return `translate(-170px, -200px)`;
                case 3 && 'submarine':
                    return `translate(-165px, -170px)`;    
                case 3 && 'cruser':
                    return `translate(-172px, -210px)`;
                case 4 && 'battleship':
                    return `translate(-175px, -245px)`;
                case 5 &&'carrier':
                    return `translate(-180px, -270px)`;
            }
        } else {
            switch(size && name) {
                case 2 && 'destroyer':
                    return `translate(-170px, -100px)`;
                case 3 && 'submarine':
                    return `translate(-165px, -25px)`;
                case 3 && 'cruser':
                    return `translate(-172px, -60px)`;
                case 4 && 'battleship':
                    return `translate(-175px, -45px)`;
                case 5 && 'carrier':
                    return `translate(-182px, -20px)`;
            }
        }
        
    }
    
    function checkShipPlacementComplete() {
        const totalPlaced = placedShips[currentPlayer].reduce((sum, ship) => sum + ship.size, 0);
        const totalRequired = Object.entries(shipLimits)
            .reduce((sum, [size, count]) => sum + size * count, 0);
    
        const deployBtn = document.getElementById("deployButton");
        deployBtn.disabled = totalPlaced !== totalRequired;
    }
    

    document.getElementById("deployButton").addEventListener("click", () => {
        document.getElementById("deployButton").style.display = "none";
    
        if (currentPlayer === 1) {
            currentPlayer = 2;
            updateShipDropdown();
            document.getElementById("turn").textContent = `Player ${currentPlayer}: Place Your Ships`;
            document.getElementById("message").textContent = "";
    
            checkShipPlacementComplete();
        } else {
            placingShips = false;
            document.getElementById("turn").textContent = `Player ${currentPlayer}'s Turn`;
        }
    });

    // Találatok logolása
    function logShot(player, cellIndex, result) {
        /*
            Player 1 shot at B4 – HIT (A cella megjelenításe)
        */
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
    }

    
    populateShipyard(1);
    populateShipyard(2);
    createGrid("grid1", 1);
    createGrid("grid2", 2);
    setupDraggableShips();
    
    });