const RushHourApp = () => {
  const [puzzlesByMoves, setPuzzlesByMoves] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Load and parse the database on mount
 React.useEffect(() => {
  console.log('Loading database...');
  fetch('./rush_no_walls.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Expand the compressed format into a more usable structure
      const db = {};
      data.m.forEach(moves => {
        db[moves] = [];
      });
      data.p.forEach(([moveIdx, board, cluster]) => {
        db[data.m[moveIdx]].push({
          board: board,
          clusterSize: cluster
        });
      });
      setPuzzlesByMoves(db);
      setLoading(false);
      console.log('Database loaded');
    })
    .catch(error => {
      console.error('Error loading database:', error);
      setLoading(false);
      document.getElementById('root').innerHTML = `<div style="color:red; padding:20px;">Error: ${error.message}</div>`;
    });
}, []);


  // Parse URL hash and redirect if needed
  React.useEffect(() => {
    if (!puzzlesByMoves) return; // Wait for data to load

    const handleUrlChange = () => {
      const hash = window.location.hash.slice(1); // Remove leading #
      const [urlMoves, urlBoard] = hash.split('/');
      
      // If we have both moves and board, URL is complete
      if (urlMoves && urlBoard) {
        // Validate that this puzzle exists
        const puzzles = puzzlesByMoves[urlMoves];
        if (puzzles && puzzles.some(p => p.board === urlBoard)) {
          return;
        }
      }

      // If we have just moves, redirect to a random puzzle of that difficulty
      if (urlMoves && puzzlesByMoves[urlMoves]) {
        const puzzles = puzzlesByMoves[urlMoves];
        const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        window.location.replace(`#${urlMoves}/${randomPuzzle.board}`);
        return;
      }

      // Default case: redirect to a random puzzle from the middle difficulty
      const moves = Object.keys(puzzlesByMoves)
        .sort((a, b) => parseInt(a) - parseInt(b))
        [Math.floor(Object.keys(puzzlesByMoves).length / 2)];
      const puzzles = puzzlesByMoves[moves];
      const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      window.location.replace(`#${moves}/${randomPuzzle.board}`);
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, [puzzlesByMoves]);

  // Get current puzzle info from URL hash
  const [_, movesStr, boardString] = (window.location.hash || '#').slice(1).split('/');
  const moves = movesStr || '';

  const handleDifficultyChange = (newMoves) => {
    const puzzles = puzzlesByMoves[newMoves];
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    window.location.hash = `${newMoves}/${randomPuzzle.board}`;
  };

  const handleRandomPuzzle = () => {
    handleDifficultyChange(moves);
  };

  // Show loading state
  if (loading || !boardString) {
    return <div className="text-center p-8">Loading puzzle database...</div>;
  }

  // Find current puzzle's cluster size
  const currentPuzzle = puzzlesByMoves[moves]?.find(p => p.board === boardString);
  const clusterSize = currentPuzzle?.clusterSize;

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Rush Hour Puzzle</h1>
                  <p className="text-gray-600">Required Moves: {moves}</p>
                  {clusterSize && (
                    <p className="text-gray-600">Cluster Size: {clusterSize}</p>
                  )}
                </div>

                {/* Difficulty Selection */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {Object.keys(puzzlesByMoves)
                    .sort((a,b) => parseInt(a) - parseInt(b))
                    .map(difficulty => (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyChange(difficulty)}
                        className={`px-4 py-2 rounded ${
                          moves === difficulty
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {difficulty} moves
                      </button>
                  ))}
                </div>

                {/* Random Puzzle Button */}
                <button
                  onClick={handleRandomPuzzle}
                  className="mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Random Puzzle of Same Difficulty
                </button>

                {/* Board Visualization */}
                <RushHourVisualization boardString={boardString} />

                {/* Share URL */}
                <div className="mt-4 text-sm text-gray-500">
                  Share URL: {window.location.href}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RushHourVisualization = ({ boardString }) => {
  // Color constants matching Go implementation
  const COLORS = {
    backgroundColor: '#FFFFFF',
    boardColor: '#F2EACD',
    blockedColor: '#D96D60',
    gridLineColor: '#222222',
    primaryPieceColor: '#CC3333',
    pieceColor: '#338899',
    pieceOutlineColor: '#222222',
    labelColor: '#222222',
    wallColor: '#222222',
  };

  // Constants
  const CELL_SIZE = 160;
  const PADDING = 32;
  const GRID_SIZE = 6;
  const BOARD_SIZE = CELL_SIZE * GRID_SIZE;
  const MARGIN = 8;
  const CORNER_RADIUS = CELL_SIZE / 8.0;
  const PIECE_MARGIN = CELL_SIZE / 8.0;
  const WALL_BOLT_RADIUS = CELL_SIZE / 32.0;

  // Convert board string to grid
  const board = [];
  for (let i = 0; i < 6; i++) {
    board.push(boardString.slice(i * 6, (i + 1) * 6).split(''));
  }

  // Find connected pieces
  const findVehicle = (startI, startJ, piece) => {
    // First try horizontal
    let width = 1;
    for (let j = startJ + 1; j < 6 && board[startI][j] === piece; j++) {
      width++;
    }
    // If no horizontal connection, try vertical
    if (width === 1) {
      let height = 1;
      for (let i = startI + 1; i < 6 && board[i][startJ] === piece; i++) {
        height++;
      }
      return { width: 1, height };
    }
    return { width, height: 1 };
  };

  // Track processed cells
  const processed = new Set();

  // Calculate total size including padding
  const totalWidth = BOARD_SIZE + (PADDING * 2);
  const totalHeight = BOARD_SIZE + (PADDING * 2);

  return (
    <svg 
      viewBox={`0 0 ${totalWidth + MARGIN * 2} ${totalHeight + MARGIN * 2}`}
      className="w-full max-w-4xl"
    >
      <g transform={`translate(${PADDING + MARGIN}, ${PADDING + MARGIN})`}>
        {/* Board background */}
        <rect 
          x="0" 
          y="0" 
          width={BOARD_SIZE + 1} 
          height={BOARD_SIZE + 1} 
          fill={COLORS.boardColor}
        />

        {/* Grid lines */}
        {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <line 
              x1={(i + 1) * CELL_SIZE} 
              y1={0} 
              x2={(i + 1) * CELL_SIZE} 
              y2={BOARD_SIZE}
              stroke={COLORS.gridLineColor}
              strokeWidth="2"
            />
            <line 
              x1={0} 
              y1={(i + 1) * CELL_SIZE} 
              x2={BOARD_SIZE} 
              y2={(i + 1) * CELL_SIZE}
              stroke={COLORS.gridLineColor}
              strokeWidth="2"
            />
          </React.Fragment>
        ))}

        {/* Board outline */}
        <rect 
          x="0" 
          y="0" 
          width={BOARD_SIZE + 1} 
          height={BOARD_SIZE + 1} 
          fill="none"
          stroke={COLORS.gridLineColor}
          strokeWidth="6"
        />

        {/* Exit marker */}
        <path
          d={`M ${BOARD_SIZE},${2.5 * CELL_SIZE} L ${BOARD_SIZE + CELL_SIZE/10},${2.5 * CELL_SIZE} L ${BOARD_SIZE},${2.5 * CELL_SIZE - CELL_SIZE/10} L ${BOARD_SIZE},${2.5 * CELL_SIZE + CELL_SIZE/10} Z`}
          fill={COLORS.gridLineColor}
        />

        {/* Walls */}
        {board.map((row, i) => 
          row.map((cell, j) => {
            if (cell !== 'x') return null;
            return (
              <g key={`wall-${i}-${j}`}>
                <rect
                  x={j * CELL_SIZE}
                  y={i * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={COLORS.wallColor}
                />
                {/* Wall bolts */}
                {[[1,1], [1,7], [7,1], [7,7]].map(([px, py], idx) => (
                  <circle
                    key={idx}
                    cx={j * CELL_SIZE + CELL_SIZE * px/8}
                    cy={i * CELL_SIZE + CELL_SIZE * py/8}
                    r={WALL_BOLT_RADIUS}
                    fill={COLORS.boardColor}
                  />
                ))}
              </g>
            );
          })
        )}

        {/* Vehicles */}
        {board.map((row, i) => 
          row.map((cell, j) => {
            const cellKey = `${i}-${j}`;
            if (cell === 'o' || cell === 'x' || processed.has(cellKey)) return null;
            
            const { width, height } = findVehicle(i, j, cell);
            
            // Mark cells as processed
            for (let di = 0; di < height; di++) {
              for (let dj = 0; dj < width; dj++) {
                processed.add(`${i + di}-${j + dj}`);
              }
            }

            const x = j * CELL_SIZE + PIECE_MARGIN;
            const y = i * CELL_SIZE + PIECE_MARGIN;
            const w = width * CELL_SIZE - PIECE_MARGIN * 2;
            const h = height * CELL_SIZE - PIECE_MARGIN * 2;

            return (
              <g key={cellKey}>
                <rect
                  x={x + 0.5}
                  y={y + 0.5}
                  width={w}
                  height={h}
                  rx={CORNER_RADIUS}
                  ry={CORNER_RADIUS}
                  fill={cell === 'A' ? COLORS.primaryPieceColor : COLORS.pieceColor}
                  stroke={COLORS.pieceOutlineColor}
                  strokeWidth={CELL_SIZE/32.0}
                />
              </g>
            );
          })
        )}
      </g>
    </svg>
  );
};

ReactDOM.render(
  <RushHourApp />,
  document.getElementById('root')
);
