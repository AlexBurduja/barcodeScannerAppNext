import React, { useState } from 'react';
import BarcodeForm from '../components/BarcodeForm';

const App = () => {
  const [scannedCode, setScannedCode] = useState('');

  const handleScan = (code) => {
    setScannedCode(code);
  };

  return (
    <div className="app">
      <h1>Barcode Scanner</h1>
      {scannedCode && <p>Scanned Code: {scannedCode}</p>}
      <BarcodeForm onScan={handleScan} />
    </div>
  );
};

export default App;