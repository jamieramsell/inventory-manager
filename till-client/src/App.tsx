import {useEffect, useState} from 'react';
import './App.css';

/**
 * Root till component. For the M0 skeleton it only proves the wire to the
 * backend by calling the /ping endpoint (proxied to the Spring Boot service in
 * development) and showing the result.
 */
function App() {
  const [status, setStatus] = useState('checking backend…');

  useEffect(() => {
    fetch('/ping')
      .then(res =>
        res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then(body => setStatus(`backend says: ${body}`))
      .catch((err: Error) => setStatus(`backend unreachable (${err.message})`));
  }, []);

  return (
    <main>
      <h1>inventory-manager · till</h1>
      <p>{status}</p>
    </main>
  );
}

export default App;
