import React, { useRef, useEffect, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
import { db, storage } from '../components/FirebaseConfig';
import { addDoc, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytesResumable } from 'firebase/storage';
import {IoMdReverseCamera} from 'react-icons/io'

const Home = () => {
  const videoRef = useRef(null);

  const [selfie, setSelfie ] = useState('user')
  const [barcode, setBarcode] = useState('')

  function switchCamera(){
    selfie === 'user' ? setSelfie('environment') : setSelfie('user')
  }

  const [cameraOn, setCameraOn] = useState(true);

  const startScanner = useCallback(() => {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          name: 'Live',
          target: document.querySelector('.video-container'), // Use the videoRef to target the video element
          constraints: {
            width: 1920,
            height: 1080,
            facingMode: selfie,
          },
        },
        decoder: {
          readers: ['code_128_reader'],
        },
      },
      (err) => {
        if (err) {
          console.error('Error initializing Quagga:', err);
          return;
        }

        Quagga.start();
      }
    );
  }, [selfie]);

  const toggleCamera = useCallback(() => {
    setCameraOn((prevCameraOn) => {
      if (prevCameraOn) {
        Quagga.stop(); // Turn off the camera
      } else {
        startScanner(); // Turn on the camera
      }
      return !prevCameraOn; // Toggle the camera status
    });
  }, [startScanner]);
  
  useEffect(() => {
    let scannerRef = null;

    if (cameraOn) {
      startScanner(); // Start the scanner if cameraOn is true
    } else {
      Quagga.stop(); // Stop the scanner if cameraOn is false
    }

    Quagga.onDetected((result) => {
      if (result && result.codeResult && result.codeResult.code) {
        const code = result.codeResult.code;
    
        // Check if the code is a valid document ID
        const isValidCode = typeof code === 'string' && code.length > 0 && !code.includes('/');
        if (!isValidCode) {
          console.error('Invalid barcode code:', code);
          return; // or handle the invalid code accordingly
        }

        Quagga.stop();
        setCameraOn(false)
    
        setBarcode(code);
        setWorker([])
    
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
  }, [startScanner, cameraOn]);

  const [camera, setCamera] = useState(false)

  const [existingBarcodes, setExistingBarcodes] = useState([])
  
  const [worker, setWorker] = useState([])

  const [isOpen, setIsOpen] = useState(false)

  function openSection (section) {
    setIsOpen(section === isOpen ? null : section)
  }

  console.log(isOpen)

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


  useEffect(() => {
    if (barcode) {
      const childRef = ref(storage, barcode);
  
      listAll(childRef)
        .then((res) => {
          setWorker((prevWorker) => {
            const updatedWorker = { ...prevWorker };
  
            res.items.forEach((itemRef) => {
              const itemName = itemRef.name;
  
              getDownloadURL(itemRef)
                .then((downloadURL) => {
                  updatedWorker[itemName] = downloadURL;
                  // Call setWorker after all items are processed
                  if (itemRef === res.items[res.items.length - 1]) {
                    setWorker(updatedWorker);
                  }
                })
                .catch((error) => {
                  console.error('Error getting download URL:', error);
                });
            });
  
            return updatedWorker;
          });
        })
        .catch((error) => {
          console.error('Error listing files:', error);
        });
    }
  }, [barcode]);

  console.log(worker)

    function deleteImagesOrPdfs (fileName){
      const fileRef = ref(storage, `${barcode}/${fileName}`)

      deleteObject(fileRef)
      .then(() => {
        setWorker((prevWorker) => {
          const updatedWorker = { ...prevWorker };
          delete updatedWorker[fileName]
          return updatedWorker;
        });
      })
      .catch((error) => {
        console.error('Error deleting file:', error)
      });
    };

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

    const [value, setValue] = useState('ci')

    function changeValue(event){
      setValue(event.target.value)
    }

    // console.log(worker)

  return (
    <section className='bigMainSection'>


      <div className='divCenter'>
        {barcode}
      </div>

        <div className="barcode-scanner">
          {cameraOn && 
          <div className="video-container"> 
            <button onClick={switchCamera}><IoMdReverseCamera /></button>
          </div>
          }
        </div>

      <div className='divCenter'>
        <button className='turnOffOnButton' onClick={toggleCamera}>{cameraOn ? 'Turn off' : 'Turn on'} </button>
      </div>

      <div>
        <p>{worker.nume}</p>
        <p>{worker.varsta}</p>
        <p>{worker.job}</p>
      </div>

        

        <div className='fileUploadSelector'>
          Alege tipul de fisier pe care vrei sa il incarci din lista de mai jos, dupa care apasa pe &quot;Choose File&quot;, alege din calculator fisierul pe care doresti sa il incarci si apoi apasa pe &quot;Upload!&quot; !
          <select name="languages" id="lang" onChange={changeValue}>
            <option value="ci" >Ci</option>
            <option value="contractDeMunca">Contract</option>
            <option value="permis">Permis</option>
            <option value="acteStudii">Acte Studii</option>
            <option value="fisaPostului">Fisa Postului</option>
            <option value="adeverintaMedicala">Adeverinta Medicala</option>
            <option value="cazier">Cazier</option>
          </select>
          
        <input type='file' name='ci' id='ci' onChange={handleChange}></input>
        
        <button onClick={handleUpload}>Upload!</button>
        <p>{percent} &quot;% done&quot;</p>
        </div>



      <div>
        <p onClick={() => openSection('CI')}>CI</p>

        {isOpen === 'CI' &&
          <>
            <iframe src={worker.ci} width={900} height={500} title='workerCi'></iframe>
            <button onClick={() => deleteImagesOrPdfs('ci')} >DeleteCi</button>
          </>
        }
      </div>

      <div>
        <p onClick={() => openSection('contractDeMunca')}>Contract De Munca</p>

        {isOpen === 'contractDeMunca' &&
          <>
            <iframe src={worker.contractDeMunca} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('contractDeMunca')}>DeleteContract</button>
          </>
        }
      </div>
      
      <div>
        <p onClick={() => openSection('permis')}>Permis</p>

        {isOpen === 'permis' &&
          <>
            <iframe src={worker.permis} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('permis')}>DeleteContract</button>
          </>
        }
      </div>
      
      <div>
        <p onClick={() => openSection('acteStudii')}>Acte Studii</p>

        {isOpen === 'acteStudii' &&
          <>
            <iframe src={worker.acteStudii} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('acteStudii')}>DeleteContract</button>
          </>
        }
      </div>
      
      <div>
        <p onClick={() => openSection('acteStudii')}>Fisa Postului</p>

        {isOpen === 'fisaPostului' &&
          <>
            <iframe src={worker.fisaPostului} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('fisaPostului')}>DeleteContract</button>
          </>
        }
      </div>
      
      <div>
        <p onClick={() => openSection('adeverintaMedicala')}>Adeverinta Medicala</p>

        {isOpen === 'adeverintaMedicala' &&
          <>
            <iframe src={worker.fisaPostului} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('adeverintaMedicala')}>DeleteContract</button>
          </>
        }
      </div>
      
      <div>
        <p onClick={() => openSection('cazier')}>Cazier</p>

        {isOpen === 'cazier' &&
          <>
            <iframe src={worker.cazier} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('cazier')}>DeleteContract</button>
          </>
        }
      </div>

    </section>
  )
};

export default Home;