import type { Board } from './board';
import { nextTurn, type Game } from './game';

export type Piece = {
    name: string;
    color: number;
    currentRotation: number;
    rotations: number[][][];
    offset: number[];
};

enum Direction {
    // You cannot really ever move a piece up in tetris.
    Down,
    Left,
    Right
}

/**
 * This function spawns a piece on the game board and returns if the spawn succeeded.
 */
export const spawnPiece = (board: Board, piece: Piece): boolean => {
    resetPiece(piece);

    const gb: number[][] = board.GameBoard;

    const pieceBlocks = getPieceCoordinates(piece);

    // First we check if the board is already full at the coordinates that we want the piece to spawn in.
    // This is an automatic game over.
    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = pieceBlocks[i];
        if (gb[coords[0]][coords[1]] !== 0) {
            return false;
        }
    }

    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = pieceBlocks[i];
        gb[coords[0]][coords[1]] = piece.color;
    }

    return true;
};

/**
 * Holds a piece and spawns either the currently held piece, or the next one from the stack if you are not holding one.
 */
export const holdPiece = (game: Game): void => {
    // You can only hold a piece one time per turn, otherwise you could just stall forever.
    if (!game.holdThisTurn) {
        return;
    }

    // Despawning the current piece.
    const pieceCoordinates = getPieceCoordinates(game.currentPiece);
    for (let i = 0; i < pieceCoordinates.length; i++) {
        const coords = pieceCoordinates[i];
        game.board.GameBoard[coords[0]][coords[1]] = 0;
    }

    // If you are not currently holding a piece, it is like ending your turn, kind of.
    if (!game.holdPiece) {
        game.holdPiece = game.currentPiece;
        nextTurn(game);
        // But we have to make sure to set this to false.
        game.holdThisTurn = false;
        return;
    }

    // If you are holding a piece, we swap the current piece and the hold piece.
    const bufferPiece = game.currentPiece;
    game.currentPiece = game.holdPiece;
    game.holdPiece = bufferPiece;

    // Then spawning the previously held piece.

    spawnPiece(game.board, game.currentPiece);

    // Also need to set the ticks to 0 manually.
    game.ticks = 0;
    // And of course turn off the ability to swap again.
    game.holdThisTurn = false;
};

/**
 * This function rotates a piece clockwise or counter-clockwise and returns if the move succeeded.
 */
export const rotatePiece = (board: Board, piece: Piece, clockwise: boolean): boolean => {
    // Getting the next rotation in the list (0-3). If it rolls over we need to account for that.
    let nextRotation = (piece.currentRotation + (clockwise ? 1 : -1)) % 4;
    if (nextRotation === -1) {
        nextRotation += 4;
    }

    const pieceCoordinates = getPieceCoordinates(piece);
    const rotatedPiece: Piece = {
        ...piece,
        currentRotation: nextRotation
    };

    let collisionBlocks = getPieceCoordinates(rotatedPiece);

    // Filtering out all of the pieces that the current piece occupies.
    collisionBlocks = collisionBlocks.filter((b) => {
        for (let i = 0; i < pieceCoordinates.length; i++) {
            if (b[0] === pieceCoordinates[i][0] && b[1] === pieceCoordinates[i][1]) {
                return false;
            }
        }
        return true;
    });

    // We need to check if the blocks that the rotated piece will be in are empty and on the board.
    for (let i = 0; i < collisionBlocks.length; i++) {
        const coords = collisionBlocks[i];
        if (
            coords[0] < 0 ||
            coords[0] >= board.GameBoard.length ||
            coords[1] < 0 ||
            coords[1] >= board.GameBoard[i].length ||
            board.GameBoard[coords[0]][coords[1]] !== 0
        ) {
            return false;
        }
    }

    // We first set all "old" blocks to zero, before setting the new blocks to 1.
    for (let i = 0; i < pieceCoordinates.length; i++) {
        const coords = pieceCoordinates[i];
        board.GameBoard[coords[0]][coords[1]] = 0;
    }

    piece.currentRotation = nextRotation;

    const newPieceBlocks = getPieceCoordinates(piece);

    for (let i = 0; i < newPieceBlocks.length; i++) {
        const coords = newPieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = piece.color;
    }

    return true;
};

/**
 * This function moves a piece down by 1 and returns if the move succeeded.
 */
export const movePieceDown = (board: Board, piece: Piece): boolean => {
    const pieceBlocks = getPieceCoordinates(piece);
    // These are the blocks that face down from the given piece, we check for collision on those.
    const blocksToBeCollidedWith = getCollisionBlocks(pieceBlocks, Direction.Down);

    for (let i = 0; i < blocksToBeCollidedWith.length; i++) {
        const coords = blocksToBeCollidedWith[i];
        if (coords[0] >= board.GameBoard.length || board.GameBoard[coords[0]][coords[1]] !== 0) {
            return false;
        }
    }

    // We first set all "old" blocks to zero, before setting the new blocks to 1.
    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = pieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = 0;
    }

    piece.offset[0] += 1;

    const newPieceBlocks = getPieceCoordinates(piece);

    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = newPieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = piece.color;
    }

    return true;
};

/**
 * This function drops a piece down as far as it will go.
 * Returns how many spaces the piece has fallen.
 */
export const dropPieceDown = (board: Board, piece: Piece): number => {
    let fallen = 0;
    let result = true;

    while (result) {
        result = movePieceDown(board, piece);
        fallen++;
    }

    return fallen;
};

/**
 * This function moves a piece left by 1 and returns if the move succeeded.
 */
export const movePieceLeft = (board: Board, piece: Piece): boolean => {
    const pieceBlocks = getPieceCoordinates(piece);
    // These are the blocks that face left from the given piece, we check for collision on those.
    const blocksToBeCollidedWith = getCollisionBlocks(pieceBlocks, Direction.Left);

    for (let i = 0; i < blocksToBeCollidedWith.length; i++) {
        const coords = blocksToBeCollidedWith[i];
        if (coords[1] < 0 || board.GameBoard[coords[0]][coords[1]] !== 0) {
            return false;
        }
    }

    // We first set all "old" blocks to zero, before setting the new blocks to 1.
    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = pieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = 0;
    }

    piece.offset[1] -= 1;

    const newPieceBlocks = getPieceCoordinates(piece);

    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = newPieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = piece.color;
    }

    return true;
};

/**
 * This function moves a piece right by 1 and returns if the move succeeded.
 */
export const movePieceRight = (board: Board, piece: Piece): boolean => {
    const pieceBlocks = getPieceCoordinates(piece);
    // These are the blocks that face right from the given piece, we check for collision on those.
    const blocksToBeCollidedWith = getCollisionBlocks(pieceBlocks, Direction.Right);

    for (let i = 0; i < blocksToBeCollidedWith.length; i++) {
        const coords = blocksToBeCollidedWith[i];
        if (coords[1] >= board.GameBoard[i].length || board.GameBoard[coords[0]][coords[1]] !== 0) {
            return false;
        }
    }

    // We first set all "old" blocks to zero, before setting the new blocks to 1.
    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = pieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = 0;
    }

    piece.offset[1] += 1;

    const newPieceBlocks = getPieceCoordinates(piece);

    for (let i = 0; i < pieceBlocks.length; i++) {
        const coords = newPieceBlocks[i];
        board.GameBoard[coords[0]][coords[1]] = piece.color;
    }
    return true;
};

/**
 * This function gets the current coordinates of a piece.
 */
export const getPieceCoordinates = (piece: Piece): number[][] => {
    const pieceBlocks: number[][] = [];

    for (let i = 0; i < piece.rotations[piece.currentRotation].length; i++) {
        for (let j = 0; j < piece.rotations[piece.currentRotation][i].length; j++) {
            if (piece.rotations[piece.currentRotation][i][j] !== 0) {
                pieceBlocks.push([i + piece.offset[0], j + piece.offset[1]]);
            }
        }
    }

    return pieceBlocks;
};

/**
 * This function gets the coordinates of a "shadow" piece.
 * Meaning a piece, if it were to be dropped as far as it will go in the current position.
 */
export const getShadowPieceCoordinates = (board: Board, piece: Piece): number[][] => {
    // Creating copies of the piece and board because we are only pretending to drop a piece.
    const shadowPiece: Piece = JSON.parse(JSON.stringify(piece));
    const shadowBoard: Board = JSON.parse(JSON.stringify(board));

    dropPieceDown(shadowBoard, shadowPiece);

    return getPieceCoordinates(shadowPiece);
};

/**
 * Returns the coordinates of the blocks that the piece will collide with, if moved in that direction.
 * Excludes blocks of the same piece.
 */
export const getCollisionBlocks = (
    pieceCoordinates: number[][],
    direction: Direction
): number[][] => {
    const collisionBlocks: number[][] = [];

    if (direction === Direction.Down) {
        for (let i = 0; i < pieceCoordinates.length; i++) {
            collisionBlocks.push([pieceCoordinates[i][0] + 1, pieceCoordinates[i][1]]);
        }
    } else {
        const shiftedBy = direction === Direction.Left ? -1 : 1;

        for (let i = 0; i < pieceCoordinates.length; i++) {
            collisionBlocks.push([pieceCoordinates[i][0], pieceCoordinates[i][1] + shiftedBy]);
        }
    }

    return collisionBlocks.filter((b) => {
        for (let i = 0; i < pieceCoordinates.length; i++) {
            if (b[0] === pieceCoordinates[i][0] && b[1] === pieceCoordinates[i][1]) {
                return false;
            }
        }
        return true;
    });
};

export const resetPiece = (piece: Piece): void => {
    piece.offset = [0, 3];
    piece.currentRotation = 0;
};

// These rotations are from the "Super Rotation System (SRS)"
// https://strategywiki.org/wiki/Tetris/Rotation_systems
export const allPieces: Piece[] = [
    {
        name: 'I',
        color: 1,
        currentRotation: 0,
        rotations: [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0]
            ]
        ],
        // The initial offset of the piece.
        offset: [0, 3]
    },
    {
        name: 'J',
        color: 2,
        currentRotation: 0,
        rotations: [
            [
                [1, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    },
    {
        name: 'L',
        color: 3,
        currentRotation: 0,
        rotations: [
            [
                [0, 0, 1, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    },
    {
        name: 'O',
        color: 4,
        currentRotation: 0,
        rotations: [
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    },
    {
        name: 'S',
        color: 5,
        currentRotation: 0,
        rotations: [
            [
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [1, 0, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    },
    {
        name: 'Z',
        color: 6,
        currentRotation: 0,
        rotations: [
            [
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 1, 0],
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    },
    {
        name: 'T',
        color: 7,
        currentRotation: 0,
        rotations: [
            [
                [0, 1, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0]
            ]
        ],
        offset: [0, 3]
    }
];

/**
 * This is for rendering the preview of upcoming/held pieces.
 */
export const getDefaultPiece = (pieceType: string | null): number[][] => {
    switch (pieceType) {
        case 'I':
            return [
                [0, 0, 0, 0],
                [1, 1, 1, 1]
            ];
        case 'J':
            return [
                [2, 0, 0, 0],
                [2, 2, 2, 0]
            ];
        case 'L':
            return [
                [0, 0, 3, 0],
                [3, 3, 3, 0]
            ];
        case 'O':
            return [
                [0, 4, 4, 0],
                [0, 4, 4, 0]
            ];
        case 'S':
            return [
                [0, 5, 5, 0],
                [5, 5, 0, 0]
            ];
        case 'Z':
            return [
                [6, 6, 0, 0],
                [0, 6, 6, 0]
            ];
        case 'T':
            return [
                [0, 7, 0, 0],
                [7, 7, 7, 0]
            ];
        default:
            return [
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ];
    }
};

export const getNextPieceTable = (nextPieces: Piece[]): number[][] => {
    const table: number[][] = [];

    for (let i = 0; i < nextPieces.length; i++) {
        table.push([0, 0, 0, 0]);
        table.push(...getDefaultPiece(nextPieces[i].name));
    }

    table.push([0, 0, 0, 0]);

    return table;
};
