import { useEffect, useState } from "react";
import "../assets/css/voting-results.css";

function VotingResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:4000/api/votings", {
  headers: { Authorization: `Bearer ${token}` }
});
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <div className="loading">Loading hasil voting...</div>;

  return (
    <div className="results-container">
      <h2>Hasil Voting</h2>
      <div className="results-grid">
        {results.map((item, idx) => (
          <div className="result-card" key={idx}>
            <img src={item.foto_url} alt={item.nama} className="candidate-photo" />
            <h3>{item.nama}</h3>
            <p>NIM: {item.nim}</p>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${item.persentase}%` }}
              ></div>
            </div>
            <p className="votes">
              {item.jumlah_vote} suara ({item.persentase}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VotingResults;
