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

    const [modal, setModal] = useState(false)

    function openModal() {
      setModal(!modal)
    }

    const [name, setName] = useState(worker.nume)
    const [job, setJob] = useState(worker.job)
    const [stareCivila, setStareCivila] = useState(worker.stareCivila)
    const [copii, setCopii] = useState(worker.copii)
    const [zileConcediu, setZileConcediu] = useState(worker.zileConcediu)

    useEffect(() => {
      setName(worker.nume)
      setJob(worker.job)
      setStareCivila(worker.stareCivila)
      setCopii(worker.copii)
      setZileConcediu(worker.zileConcediu)
    }, [worker.nume, worker.job, worker.stareCivila, worker.copii, worker.zileConcediu])

    function nameHandler(event) {
      setName(event.target.value)
    }
    
    function jobHandler(event) {
      setJob(event.target.value)
    }

    function stareCivilaHandler(event) {
      setStareCivila(event.target.value)
    }
    function copiiHandler(event) {
      setCopii(event.target.value)
    }
    function zileConcediuHandler(event) {
      setZileConcediu(event.target.value)
    }

    console.log(name)

  return (
    <section className='bigMainSection'>
      <h1>Baza De Date Angajati (Mabis Wood Eko)</h1>

        <div className="barcode-scanner">
          {cameraOn && 
          <div className="video-container"> 
            <button onClick={switchCamera}><IoMdReverseCamera /></button>
          </div>
          }
        </div>

      <div className='divCenter'>
        <button className='turnOffOnButton' onClick={toggleCamera}>{cameraOn ? 'Stop Scanner' : 'Start Scanner'} </button>
      </div>

      {modal && (
        <div className='modal'>
          <div className='overlay' onClick={openModal}></div>
            <div className='modal-content'>
              <h1>Adaugati / Stergeti Date / Informatii pentru {worker.nume} ({barcode})</h1>

          <div className="deliveryAddress_inputs">
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={name} onChange={nameHandler}></input>
              <span>Nume</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={job} onChange={jobHandler}></input>
              <span>Job</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={stareCivila} onChange={stareCivilaHandler}></input>
              <span>Stare Civila</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={copii} onChange={copiiHandler}></input>
              <span>Copii</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={zileConcediu} onChange={zileConcediuHandler}></input>
              <span>Zile Concediu</span>
            </div>

          </div>

        <div className='fileUploadSelector'>
            <p>
              Alege tipul de fisier pe care vrei sa il incarci din lista de mai jos, dupa care apasa pe &quot;Choose File&quot;, alege din calculator fisierul pe care doresti sa il incarci si apoi apasa pe &quot;Upload!&quot; !
            </p>
          <select name="languages" id="lang" onChange={changeValue}>
            <option value="ci" >Ci</option>
            <option value="contractDeMunca">Contract</option>
            <option value="permis">Permis</option>
            <option value="acteStudii">Acte Studii</option>
            <option value="fisaPostului">Fisa Postului</option>
            <option value="adeverintaMedicala">Adeverinta Medicala</option>
            <option value="cazier">Cazier</option>
          </select>
            
          <input type='file' name='ci' id='ci' onChange={handleChange} accept='image/*, .pdf'></input>
          
          <button onClick={handleUpload}>Upload!</button>
        </div>

            </div>
        </div>
      )}


    {barcode &&
    <>
        <section className='workerSection'>
          <div className='workerInfo'>
            <p>{barcode}</p>
            <p>Nume: {worker.nume}</p>
            <p>Stare Civila: {worker.stareCivila}</p>
            <p>Functie: {worker.job}</p>
            <p>Copii: {worker.copii}</p>
            <p>Zile Concediu: {worker.zileConcediu}</p>
          </div>

          <div>
            <button onClick={openModal}>Adaugati / Schimbati Date sau Informatii</button>
          </div>
        </section>
    

    <section className='acteSection'>
      <p onClick={() => openSection('CI')}>C.I.</p>
      <div>

        {isOpen === 'CI' &&
          <>
            <iframe src={worker.ci} width={900} height={500} title='workerCi'></iframe>
            <button onClick={() => deleteImagesOrPdfs('ci')} >Stergeti C.I.</button>
          </>
        }
      </div>

        <p onClick={() => openSection('contractDeMunca')}>Contract De Munca</p>
      <div>

        {isOpen === 'contractDeMunca' &&
          <>
            <iframe src={worker.contractDeMunca} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('contractDeMunca')}>Stergeti Contract</button>
          </>
        }
      </div>
      
        <p onClick={() => openSection('permis')}>Permis</p>
      <div>

        {isOpen === 'permis' &&
          <>
            <iframe src={worker.permis} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('permis')}>Stergeti Permis</button>
          </>
        }
      </div>
      
        <p onClick={() => openSection('acteStudii')}>Acte Studii</p>
      <div>

        {isOpen === 'acteStudii' &&
          <>
            <iframe src={worker.acteStudii} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('acteStudii')}>Stergeti Acte Studii</button>
          </>
        }
      </div>
      
        <p onClick={() => openSection('acteStudii')}>Fisa Postului</p>
      <div>

        {isOpen === 'fisaPostului' &&
          <>
            <iframe src={worker.fisaPostului} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('fisaPostului')}>Stergeti Fisa Postului</button>
          </>
        }
      </div>
      
        <p onClick={() => openSection('adeverintaMedicala')}>Adeverinta Medicala</p>
      <div>

        {isOpen === 'adeverintaMedicala' &&
          <>
            <iframe src={worker.adeverintaMedicala} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('adeverintaMedicala')}>Stergeti Adeverinta Medicala</button>
          </>
        }
      </div>
      
        <p onClick={() => openSection('cazier')}>Cazier</p>
      <div>

        {isOpen === 'cazier' &&
          <>
            <iframe src={worker.cazier} title='workerContract'></iframe>
            <button onClick={() => deleteImagesOrPdfs('cazier')}>Stergeti Cazier</button>
          </>
        }
      </div>
      </section>
      </>
      }

    </section>
  )
};

export default Home;