function onInit() {
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        minesPlaced: false,
        secsPassed: 0
    }

    gBoard = buildBoard()
    renderBoard(gBoard)
}


function buildBoard() {
    const board = createMat(4, 4)

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
    // board[0][0].isMine = true
    // board[1][1].isMine = true

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

    if (!gGame.minesPlaced) {
        placeMinesRandomlyAvoidFirst(gBoard, 2, i, j)
        setMinesNegsCount(gBoard)
        gGame.minesPlaced = true
    }

    cell.isShown = true
    gGame.shownCount++

    if (cell.isMine) {
        elCell.innerHTML = '💣'
        elCell.classList.add('mine')
        revealAllMines()
        console.log('Game Over!')
        gGame.isOn = false
        return
    } else {
        elCell.innerHTML = cell.minesAroundCount || ''
        elCell.classList.add('revealed')
    }


    if (cell.minesAroundCount === 0) {
        expandShown(gBoard, i, j)
        renderBoard(gBoard)

    }
    checkGameOver()
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
    let revealedCells = 0
    let flaggedMines = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isShown) revealedCells++
            if (cell.isMarked && cell.isMine) flaggedMines++
        }
    }

    const totalCells = gBoard.length * gBoard[0].length
    if (revealedCells + flaggedMines === totalCells) {
        gGame.isOn = false
        console.log('You Win!')
        alert('Congratulations! You Won!')
    }
}


function onCellMarked(event, i, j) {
    event.preventDefault()
    const cell = gBoard[i][j]

    if (cell.isShown) return

    cell.isMarked = !cell.isMarked
    renderBoard(gBoard)
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

