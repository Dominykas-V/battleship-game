import React, { useEffect, useState } from "react";

function App() {
  const [backendData, setBackendData] = useState([{}]);

  //Fetches only onload, because of []
  useEffect(() => {
    fetch("/api/v1/battleships")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  }, []);

  return (
    <div>
      {typeof backendData.board === "undefined" ? (
        <p>Loading...</p>
      ) : (
        backendData.board.map((sq, i) => <p key={i}>{sq}</p>)
      )}
    </div>
  );
}

export default App;
