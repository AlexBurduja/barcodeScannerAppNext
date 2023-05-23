import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { db } from './FirebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

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
        setBarcode(result.codeResult.code);
        onScan(result.codeResult.code);
    
        const ref = doc(db, 'barcodes', result.codeResult.code);
    
        getDoc(ref)
          .then((snapshot) => {
            if (snapshot.exists()) {
              setWorker(snapshot.data());
              
            } else {
              const setRef = doc(db, 'barcodes');
              setDoc(setRef, result.codeResult.code);
            }
          })
          .catch((error) => {
            console.error('Error fetching document:', error);
          });
      }
    });

    return () => {
      if (scannerRef) {
        Quagga.stop();
      }
    };
  }, [onScan , selfie]);

  const [existingBarcodes, setExistingBarcodes] = useState([])
  
  const [worker, setWorker] = useState([])

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

    const retrieveCodesFirebase = async (code) =>  {
      const ref = doc(db, `barcodes/1234567890`)
  
      const docs = await getDoc(ref)
      const data = docs.data();
    
      setWorker(data)
    }

    // retrieveCodesFirebase();
  


  return (
    <>
      <div className="barcode-scanner">
        <div className="video-container">
          <video ref={videoRef} className="video-preview" />
        </div>
      </div>

    <div>
      <p>{worker.nume}</p>
      <p>{worker.varsta}</p>
      <p>{worker.job}</p>
    </div>

      <button onClick={switchCamera}>Hi</button>
      {/* <button onClick={retrieveCodesFirebase}>Create</button> */}
    </>
  )
};

export default BarcodeForm;