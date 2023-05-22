import React, { useRef, useEffect } from 'react';
import Quagga from '@ericblade/quagga2';

const BarcodeForm = ({ onScan }) => {
  const videoRef = useRef();

  useEffect(() => {
    let scannerRef = null;

    const initQuagga = async () => {
      try {
        const cameras = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = cameras.filter((device) => device.kind === 'videoinput');
        const constraints = {
          width: 640,
          height: 480,
          deviceId: videoDevices[0].deviceId, // Specify the initial camera to use
        };

        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              name: 'Live',
              target: videoRef.current,
              constraints,
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
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    initQuagga();

    return () => {
      if (scannerRef) {
        Quagga.stop();
      }
    };
  }, [onScan]);

  return <div className="barcode-scanner">
    <video ref={videoRef} autoPlay playsInline muted/>
  </div>;
};

export default BarcodeForm;
