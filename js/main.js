gLevel = {
    SIZE: 4,
    MINES: 2
}

function onInit() {
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        minesPlaced: false,
        secsPassed: 0,
        timerInterval: null,
        safeClicks: 3,
        lives: 3,
        hints: 3,
        isHintMode: false,
        megaHintAvailable: true,
        isMegaHintMode: false,
        megaHintCoords: []
    }

    gBoard = buildBoard()
    renderBoard(gBoard)

    updateLivesUI()

    const elBestTime = document.querySelector('.best-time')
    elBestTime.innerText = `Best Time: ${getBestTime(gLevel.SIZE)}`

    const elHintBtn = document.querySelector('.hint')
    elHintBtn.innerText = `Hints: ${gGame.hints}`

    const elSafeClickBtn = document.querySelector('.safe-click')
    elSafeClickBtn.innerText = `Safe Clicks: ${gGame.safeClicks}`

    const elTimer = document.querySelector('.timer')
    elTimer.innerText = 'Time: 0s'

    updateSmiley('😃')

    const elMegaHintBtn = document.querySelector('.mega-hint')
    elMegaHintBtn.disabled = false
    elMegaHintBtn.innerText = 'Mega Hint'
}

function setLevel(size, mines) {
    gLevel.SIZE = size
    gLevel.MINES = mines

    stopTimer()
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = 'Time: 0s'
    onInit()

    const elBestTime = document.querySelector('.best-time')
    elBestTime.innerText = `Best Time: ${getBestTime(size)}`
}

function buildBoard() {
    const board = createMat(gLevel.SIZE, gLevel.SIZE)

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = ({
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            })
        }
    }
    return board
}

function renderBoard(board) {

    const elBoard = document.querySelector('.board')
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]

            const cellClass = getClassName({ i, j }) +
                (cell.isShown ? ' revealed' : '') +
                (cell.isMarked ? ' flagged' : '') +
                (cell.isMine && cell.isShown ? ' mine' : '')

            const cellContent = cell.isMarked
                ? '🚩'
                : cell.isShown
                    ? (cell.isMine ? '💣' : cell.minesAroundCount || '')
                    : ''

            strHTML += `<td class="cell ${cellClass}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(event, ${i}, ${j})">`
            strHTML += cellContent

            strHTML += '</td>\n'
        }
        strHTML += '</tr>\n'
    }
    elBoard.innerHTML = strHTML
}

function onCellClicked(elCell, i, j) {
    const cell = gBoard[i][j]

    if (!gGame.isOn || cell.isShown || cell.isMarked) return

    if (gGame.isMegaHintMode) {
        gGame.megaHintCoords.push({ i, j })

        if (gGame.megaHintCoords.length === 2) {
            revealMegaHint()
            gGame.isMegaHintMode = false
            gGame.megaHintAvailable = false
            const elMegaHintBtn = document.querySelector('.mega-hint')
            elMegaHintBtn.disabled = true
        }
        return
    }

    if (gGame.isHintMode) {
        revealHint(i, j)
        gGame.isHintMode = false
        gGame.hints--
        const elHintBtn = document.querySelector('.hint')
        elHintBtn.innerText = `Hints: ${gGame.hints}`
        return
    }

    if (!gGame.minesPlaced) {
        startTimer()
        placeMinesRandomlyAvoidFirst(gBoard, gLevel.MINES, i, j)
        setMinesNegsCount(gBoard)
        gGame.minesPlaced = true
    }

    if (cell.isMine) {
        gGame.lives--
        updateLivesUI()

        if (gGame.lives === 0) {
            stopTimer()
            revealAllMines()
            gGame.isOn = false
            updateSmiley('🤯') 
            console.log('Game Over!')
            alert('Game Over! You ran out of lives.')
            return
        } else {
            console.log(`You clicked a mine! Lives remaining: ${gGame.lives}`)
            return
        }
    }

    cell.isShown = true
    gGame.shownCount++

    elCell.innerHTML = cell.minesAroundCount || ''
    elCell.classList.add('revealed')

    if (cell.minesAroundCount === 0) {
        expandShown(gBoard, i, j)
        renderBoard(gBoard)
    }

    checkGameOver()
}

function revealMegaHint() {
    const [corner1, corner2] = gGame.megaHintCoords
    const rowStart = Math.min(corner1.i, corner2.i)
    const rowEnd = Math.max(corner1.i, corner2.i)
    const colStart = Math.min(corner1.j, corner2.j)
    const colEnd = Math.max(corner1.j, corner2.j)

    const revealedCells = []

    for (let i = rowStart; i <= rowEnd; i++) {
        for (let j = colStart; j <= colEnd; j++) {
            const cell = gBoard[i][j]
            if (!cell.isShown) {
                revealedCells.push({ i, j })
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.classList.add('hint-revealed')
                elCell.innerHTML = cell.isMine ? '💣' : cell.minesAroundCount || ''
            }
        }
    }

    setTimeout(() => {
        for (const pos of revealedCells) {
            const cell = gBoard[pos.i][pos.j]
            const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
            elCell.classList.remove('hint-revealed')
            elCell.innerHTML = cell.isShown
                ? cell.isMine ? '💣' : cell.minesAroundCount || ''
                : ''
        }
    }, 2000)
}


function activateMegaHint() {
    if (!gGame.isOn || !gGame.megaHintAvailable) return

    gGame.isMegaHintMode = true
    gGame.megaHintCoords = []
    const elMegaHintBtn = document.querySelector('.mega-hint')
    elMegaHintBtn.disabled = false
    alert('Mega Hint activated! Click two corners of a rectangle.')
}


function updateSmiley(smiley) {
    const elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = smiley
}


function updateLivesUI() {
    const elLives = document.querySelector('.lives')
    elLives.innerHTML = `Lives: ${'❤️'.repeat(gGame.lives)}${'💔'.repeat(3 - gGame.lives)}`
}

function activateHint() {
    if (!gGame.isOn || gGame.hints <= 0) return

    gGame.isHintMode = true
    const elHintBtn = document.querySelector('.hint')
    elHintBtn.innerText = `Hints: ${gGame.hints}`

    alert('Hint mode activated! Click on a cell to reveal it temporarily.')
}

function revealHint(row, col) {
    const cellsToReveal = []

    for (let i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (let j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (!gBoard[i][j].isShown) cellsToReveal.push({ i, j })
        }
    }

    for (let k = 0; k < cellsToReveal.length; k++) {
        const pos = cellsToReveal[k]
        const cell = gBoard[pos.i][pos.j]
        const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
        elCell.classList.add('hint-revealed')
        elCell.innerHTML = cell.isMine ? '💣' : cell.minesAroundCount || ''
    }

    setTimeout(() => {
        for (let k = 0; k < cellsToReveal.length; k++) {
            const pos = cellsToReveal[k]
            const cell = gBoard[pos.i][pos.j]
            const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
            elCell.classList.remove('hint-revealed')
            elCell.innerHTML = cell.isShown
                ? (cell.isMine ? '💣' : cell.minesAroundCount || '')
                : ''
        }
    }, 1000)
}



function getClassName(position) {
    const cellClass = `cell-${position.i}-${position.j}`
    return cellClass
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countNeighbors(board, i, j)
        }
    }
}

function countNeighbors(board, row, col) {
    let count = 0
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= board[i].length || (i === row && j === col)) continue
            if (board[i][j].isMine) count++
        }
    }
    return count
}

function expandShown(board, i, j) {
    for (var x = i - 1; x <= i + 1; x++) {
        if (x < 0 || x >= board.length) continue
        for (var y = j - 1; y <= j + 1; y++) {
            if (y < 0 || y >= board[x].length || (x === i && y === j)) continue

            const neighbor = board[x][y]
            if (!neighbor.isShown && !neighbor.isMine) {
                neighbor.isShown = true
                if (neighbor.minesAroundCount === 0) {
                    expandShown(board, x, y)
                }
            }
        }
    }
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) gBoard[i][j].isShown = true
        }
    }
    renderBoard(gBoard)
}

function checkGameOver() {
    let allCellsRevealed = true
    let allMinesFlagged = true
    let incorrectFlags = false

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]

            if (!cell.isMine && !cell.isShown) {
                allCellsRevealed = false
            }
            if (cell.isMine && !cell.isMarked) {
                allMinesFlagged = false
            }
            if (!cell.isMine && cell.isMarked) {
                incorrectFlags = true
            }
        }
    }

    if ((allCellsRevealed && allMinesFlagged) || (allMinesFlagged && !incorrectFlags)) {
        console.log('You Won!')
        updateSmiley('😎')
        stopTimer()
        gGame.isOn = false

        const newBest = saveBestTime(gLevel.SIZE, gGame.secsPassed)
        if (newBest) {
            alert(`Congratulations! New Best Time: ${gGame.secsPassed}s`)
        } else {
            alert('Congratulations! You Won!')
        }

        const elBestTime = document.querySelector('.best-time')
        elBestTime.innerText = `Best Time: ${getBestTime(gLevel.SIZE)}s`
    }
}



function onCellMarked(event, i, j) {
    event.preventDefault()
    const cell = gBoard[i][j]

    if (cell.isShown) return

    cell.isMarked = !cell.isMarked
    renderBoard(gBoard)
    checkGameOver()
}

function placeMinesRandomlyAvoidFirst(board, numMines, avoidRow, avoidCol) {
    let placedMines = 0
    console.log('Starting mine placement')
    while (placedMines < numMines) {
        const i = Math.floor(Math.random() * board.length)
        const j = Math.floor(Math.random() * board[0].length)

        if (Math.abs(i - avoidRow) <= 1 && Math.abs(j - avoidCol) <= 1) continue

        if (!board[i][j].isMine) {
            board[i][j].isMine = true
            placedMines++
        }
    }
    console.log('Mines placed:', placedMines)
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode')
}

function startTimer() {
    const elTimer = document.querySelector('.timer')
    gGame.secsPassed = 0
    elTimer.innerText = `Time: ${gGame.secsPassed}s`

    gGame.timerInterval = setInterval(() => {
        gGame.secsPassed++
        elTimer.innerText = `Time: ${gGame.secsPassed}s`
    }, 1000)
}

function stopTimer() {
    clearInterval(gGame.timerInterval)
    gGame.timerInterval = null
}

function saveBestTime(level, time) {
    const key = `minesweeper-best-${level}`
    const bestTime = localStorage.getItem(key)

    if (!bestTime || time < bestTime) {
        localStorage.setItem(key, time)
        return true
    }
    return false
}

function getBestTime(level) {
    const key = `minesweeper-best-${level}`
    return localStorage.getItem(key) || '--'
}

function onSafeClick() {
    if (!gGame.isOn || gGame.safeClicks <= 0) return

    const safeCells = []
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) { 
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isShown && !cell.isMarked) {
                safeCells.push({ i, j })
            }
        }
    }

    if (safeCells.length === 0) {
        alert('No safe cells left!')
        return
    }

    const randIdx = Math.floor(Math.random() * safeCells.length)
    const { i, j } = safeCells[randIdx]
    const cell = gBoard[i][j]

    cell.isShown = true
    gGame.safeClicks--

    const elSafeClickBtn = document.querySelector('.safe-click')
    elSafeClickBtn.innerText = `Safe Clicks: ${gGame.safeClicks}`

    renderBoard(gBoard)

    checkGameOver()
}
