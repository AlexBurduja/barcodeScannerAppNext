import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { db } from './FirebaseConfig';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

const BarcodeForm = ({ onScan }) => {
  const videoRef = useRef();

  const [selfie, setSelfie ] = useState('user')
  const [barcode, setBarcode] = useState('')

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
            width: 1920,
            height: 1080,
            facingMode: selfie
          },
        },
        decoder: {
          readers: ['code_128_reader']
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
        setBarcode(result.codeResult.code)
        onScan(result.codeResult.code);
      }
    });

    return () => {
      if (scannerRef) {
        Quagga.stop();
      }
    };
  }, [onScan , selfie]);

  const [existingBarcodes, setExistingBarcodes] = useState([])

  useEffect(() => {
    const getDocsFromCol = async () => {
      const ref = collection(db, 'barcodes');
      const querySnapshot = await getDocs(ref);
      const documents = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setExistingBarcodes(documents);
    };
  
    getDocsFromCol();
  }, []);

  function retrieveCodesFirebase(){
    const ref = doc(db, 'barcodes')

  }

  console.log(existingBarcodes)
  return (
    <>
      <div className="barcode-scanner">
        <div className="video-container">
          <video ref={videoRef} className="video-preview" />
        </div>
      </div>

      <button onClick={switchCamera}>Hi</button>
      <button onClick={retrieveCodesFirebase}>Create</button>
    </>
  )
};

export default BarcodeForm;