import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { db, storage } from './FirebaseConfig';
import { addDoc, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, listAll, ref, uploadBytesResumable } from 'firebase/storage';

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
        const code = result.codeResult.code;
    
        // Check if the code is a valid document ID
        const isValidCode = typeof code === 'string' && code.length > 0 && !code.includes('/');
        if (!isValidCode) {
          console.error('Invalid barcode code:', code);
          return; // or handle the invalid code accordingly
        }
    
        setBarcode(code);
        onScan(code);
    
        const ref = doc(db, 'barcodes', code);
    
        getDoc(ref)
          .then((snapshot) => {
            if (snapshot.exists()) {
              setWorker(snapshot.data());
              console.log('exists');
            } else {
              const setRef = doc(db, 'barcodes', code);
              setDoc(setRef, {});
              console.log('added');
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

  const [employeeData ,setEmployeeData] = useState([])

//   useEffect(() => {

// listAll(storage.child(barcode))
//   .then((res) => {
//     res.items.forEach((itemRef) => {
//       getDownloadURL(itemRef)
//         .then((downloadURL) => {
//           console.log(downloadURL);
//         })
//         .catch((error) => {
          
//           console.error('Error getting download URL:', error);
//         });
//     });
//   })
//   .catch((error) => {
//     // Handle any errors that occur while listing the files
//     console.error('Error listing files:', error);
//   });

//   }, [barcode]);

    const retrieveCodesFirebase = async (code) =>  {
      const ref = doc(db, `barcodes/1234567890`)
  
      const docs = await getDoc(ref)
      const data = docs.data();
    
      setWorker(data)
    }

    const [file, setFile] = useState('')
    const [percent, setPercent] = useState(0)
    
    function handleChange(event){
      setFile(event.target.files[0])
    }

    function handleUpload(){
      if(!file){
        alert('Please choose a file first!')
      }

      if(!barcode){
        alert('Scan a barcode first!')
        return;
      }

      const storageRef = ref(storage, `${barcode}/${value}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          )

          setPercent(percent)
        },
        (err) => console.log(err),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            console.log(url)
          })
        }
      )
    }

    const [value, setValue] = useState(undefined)

    console.log(value)
    function changeValue(event){
      setValue(event.target.value)
    }

    console.log(value)

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

      <div>
        What to upload?
        <select name="languages" id="lang" onChange={changeValue}>
          <option value="ci">Ci</option>
          <option value="contract">Contract</option>
        </select>
        
      </div>

    <div>
      <input type='file' name='ci' id='ci' onChange={handleChange}></input>
      
      <button onClick={handleUpload}>Upload!</button>
      <p>{percent} &quot;% done&quot;</p>
    </div>
    </>
  )
};

export default BarcodeForm;