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
            width: '90%',
            height: 300,
            aspectRatio: {min: 1, max: 2},
            facingMode: selfie
          },
        },
        decoder: {
          readers: ['code_128_reader'],
          debug: {
            drawBoundingBox: true,
            drawScanline: true,
          }
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
  }, [onScan , selfie]);

  return (
    <>
      <div className="barcode-scanner">
      </div>

      <button onClick={switchCamera}>Hi</button>
    </>
  )
};

export default BarcodeForm;