import React, { useState } from 'react';
import BarcodeForm from '../components/BarcodeForm';

const Home = () => {
  const [scannedCode, setScannedCode] = useState('');

  const handleScan = (code) => {
    setScannedCode(code);
  };

  console.log(scannedCode)

  return (
    <div className="app">
      <h1>Barcode Scanner</h1>
      {scannedCode && <p>Scanned Code: {scannedCode}</p>}
      <BarcodeForm />
    </div>
  );
};

export default Home;