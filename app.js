// Define processDatabase outside the component to ensure global accessibility
function processDatabase(data) {
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
  return db;
}

const RushHourApp = () => {
  const [puzzlesByMoves, setPuzzlesByMoves] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Load and parse the database on mount
  React.useEffect(() => {
    console.log('Loading database...');
    fetch('./rush_no_walls.json?v=' + new Date().getTime())
      .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.text(); // Read as text first to debug
      })
      .then(text => {
        console.log('Raw response text:', text);
        return JSON.parse(text); // Now try to parse JSON
      })
      .then(data => {
        console.log('Parsed JSON:', data);
        // Use the global processDatabase function
        const processedData = processDatabase(data);
        setPuzzlesByMoves(processedData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading database:', error);
        document.getElementById('root').innerHTML = `<div style="color:red; padding:20px;">Error: ${error.message}</div>`;
        setLoading(false);
      });
  }, []);

  // Rest of the component remains the same...
  // (URL parsing, rendering logic, etc.)

  // Existing render method with loading state
  if (loading) {
    return <div className="text-center p-8">Loading puzzle database...</div>;
  }

  // Existing component render logic...
  // (Your original return statement)
};

// Rest of the code (RushHourVisualization, ReactDOM.render) remains the same
ReactDOM.render(
  <RushHourApp />,
  document.getElementById('root')
);
