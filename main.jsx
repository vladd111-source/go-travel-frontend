import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    fetch('https://go-travel-backend-86i8.onrender.com/api/flights')
      .then(res => res.json())
      .then(data => setFlights(data));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1>Go Travel ✈️</h1>
      {flights.map((flight, i) => (
        <div key={i} style={{ marginBottom: 12, border: '1px solid #ddd', padding: 10 }}>
          <strong>{flight.airline}</strong><br />
          {flight.from} → {flight.to}<br />
          Цена: ${flight.price} | В пути: {flight.duration} | Пересадок: {flight.transfers}
        </div>
      ))}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
