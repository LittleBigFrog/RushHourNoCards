const RushHourApp = () => {
  const [puzzlesByMoves, setPuzzlesByMoves] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Load and parse the database on mount
  React.useEffect(() => {
    fetch('rush_no_walls.txt')
      .then(response => response.text())
      .then(text => {
        // Parse the text file into a map of moves -> puzzles
        const puzzles = new Map();
        text.split('\n').forEach(line => {
          const [moves, board, clusterSize] = line.trim().split(' ');
          if (!moves || !board) return; // Skip empty lines
          
          if (!puzzles.has(moves)) {
            puzzles.set(moves, []);
          }
          puzzles.get(moves).push({ board, clusterSize: parseInt(clusterSize) });
        });
        setPuzzlesByMoves(puzzles);
        setLoading(false);
      });
  }, []);

  // Parse URL path and redirect if needed
  React.useEffect(() => {
    if (!puzzlesByMoves) return; // Wait for data to load

    const handleUrlChange = () => {
      const path = window.location.pathname.slice(1); // Remove leading slash
      const [urlMoves, urlBoard] = path.split('/');
      
      // If we have both moves and board, URL is complete
      if (urlMoves && urlBoard) {
        // Validate that this puzzle exists
        const puzzles = puzzlesByMoves.get(urlMoves);
        if (puzzles && puzzles.some(p => p.board === urlBoard)) {
          return;
        }
      }

      // If we have just moves, redirect to a random puzzle of that difficulty
      if (urlMoves && puzzlesByMoves.has(urlMoves)) {
        const puzzles = puzzlesByMoves.get(urlMoves);
        const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        window.location.replace(`/${urlMoves}/${randomPuzzle.board}`);
        return;
      }

      // Default case: redirect to a random puzzle from the middle difficulty
      const moves = Array.from(puzzlesByMoves.keys())
        .sort((a, b) => parseInt(a) - parseInt(b))
        [Math.floor(puzzlesByMoves.size / 2)];
      const puzzles = puzzlesByMoves.get(moves);
      const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      window.location.replace(`/${moves}/${randomPuzzle.board}`);
    };

    handleUrlChange();
  }, [puzzlesByMoves]);

  // Get current puzzle info from URL
  const [_, movesStr, boardString] = window.location.pathname.split('/');
  const moves = movesStr || '';

  const handleDifficultyChange = (newMoves) => {
    const puzzles = puzzlesByMoves.get(newMoves);
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    window.location.href = `/${newMoves}/${randomPuzzle.board}`;
  };

  const handleRandomPuzzle = () => {
    handleDifficultyChange(moves);
  };

  // Show loading state
  if (loading || !boardString) {
    return <div className="text-center p-8">Loading...</div>;
  }

  // Find current puzzle's cluster size
  const currentPuzzle = puzzlesByMoves.get(moves)?.find(p => p.board === boardString);
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
                  {Array.from(puzzlesByMoves.keys())
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

// [Previous RushHourVisualization component code here]

ReactDOM.render(
    <RushHourApp />,
    document.getElementById('root')
);
