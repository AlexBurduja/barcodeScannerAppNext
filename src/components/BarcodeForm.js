import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';

const BarcodeForm = ({ onScan }) => {
  const videoRef = useRef();

  const [selfie, setSelfie ] = useState('user')

  function switchCamera(){
    selfie === 'user' ? setSelfie('environment') : setSelfie('user')
  }

  useEffect(() => {
    let scannerRef = null;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          name: 'Live',
          target: document.querySelector('.barcode-scanner'),
          constraints: {
            width: 1080,
            height: 1920,
            facingMode: selfie
          },
        },
        decoder: {
          readers: ['code_128_reader'], // or other supported barcode types
        },
      },
      (err) => {
        if (err) {
          console.error('Error initializing Quagga:', err);
          return;
        }
        
        scannerRef = Quagga.start();
      }
    );

    Quagga.onDetected((result) => {
      if (result && result.codeResult && result.codeResult.code) {
        onScan(result.codeResult.code);
      }
    });

    return () => {
      if (scannerRef) {
        Quagga.stop();
      }
    };
  }, [onScan]);

  return (
    <>
      <div className="barcode-scanner">
        <video ref={videoRef} className="video-preview" />
      </div>

      <button onClick={switchCamera}>Hi</button>
    </>
  )
};

export default BarcodeForm;