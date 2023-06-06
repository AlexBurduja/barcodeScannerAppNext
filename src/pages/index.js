import React, { useRef, useEffect, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';
import { db, storage } from '../components/FirebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, uploadBytesResumable, ref } from 'firebase/storage';
import {IoMdReverseCamera} from 'react-icons/io'
import {AnimatePresence, motion} from 'framer-motion'

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
          target: document.querySelector('.video-container'),
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

            } else {
              setModal2(true)

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

    console.log(file)

    function handleUpload(value){
      if(!barcode){
        alert('Scan a barcode first!')
        return;
      }

      if (!file){
        alert('Add a file first')
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
            setWorker((prevWorker) => {
              return { ...prevWorker, [value]:url}
            })
          })
        }
      )

      setFile('')
    }

    const [value, setValue] = useState('ci')

    function changeValue(event){
      setValue(event.target.value)
    }

    const [modal, setModal] = useState(false)
    const [modal2, setModal2] = useState(false)

    function openModal() {
      setModal(!modal)

      modal === false ? document.body.classList.add('modal-open') : document.body.classList.remove('modal-open')
    }
    

    function openModal2() {
      setModal2(!modal2)

      modal === false ? document.body.classList.add('modal-open') : document.body.classList.remove('modal-open')
    }

    const [initialName, setInitialName] = useState(worker.name);
    const [initialJob, setInitialJob] = useState(worker.job);
    const [initialStareCivila, setInitialStareCivila] = useState(worker.stareCivila);
    const [initialCopii, setInitialCopii] = useState(worker.copii);
    const [initialZileConcediu, setInitialZileConcediu] = useState(worker.zileConcediu);

    const [name, setName] = useState(worker.nume)

    const [job, setJob] = useState(worker.job)
    const [stareCivila, setStareCivila] = useState(worker.stareCivila)
    const [copii, setCopii] = useState(worker.copii)
    const [zileConcediu, setZileConcediu] = useState(worker.zileConcediu)

    const [hasChanged, setHasChanged] = useState(false)

    useEffect(() => {
      setInitialName(worker.nume)
      setInitialJob(worker.job)
      setInitialStareCivila(worker.stareCivila)
      setInitialCopii(worker.copii)
      setInitialZileConcediu(worker.zileConcediu)
    }, [worker.nume, worker.job, worker.stareCivila, worker.copii, worker.zileConcediu])

    function nameHandler(event) {
      const newName = event.target.value;
      setName(newName);
      setHasChanged(newName !== initialName);
    }
    
    function jobHandler(event) {
      const newJob = event.target.value
      setJob(newJob)
      setHasChanged(newJob !== initialJob)
    }

    function stareCivilaHandler(event) {
      const newStareCivila = event.target.value
      setStareCivila(newStareCivila)
      setHasChanged(newStareCivila !== initialStareCivila)
    }
    function copiiHandler(event) {
      const newCopii = event.target.value
      setCopii(newCopii)
      setHasChanged(newCopii !== initialCopii)
    }
    function zileConcediuHandler(event) {
      const newZileConcediu = event.target.value
      setZileConcediu(newZileConcediu)
      setHasChanged(newZileConcediu !== initialZileConcediu)
    }

    function saveChanges(){
      const database = doc(db, `barcodes/${barcode}`)
      
      const data = {
        copii: copii === undefined ? initialCopii : copii,
        job: job === undefined ? initialJob : job,
        nume: name === undefined ? initialName : name,
        stareCivila: stareCivila === undefined ? initialStareCivila : stareCivila,
        zileConcediu: zileConcediu === undefined ? initialZileConcediu : zileConcediu
    }
        updateDoc(database, data)
        .then(() => {
          const updatedFields = {};
          if (copii !== undefined) {
            updatedFields.copii = copii;
          }
          if (job !== undefined) {
            updatedFields.job = job;
          }
          if (name !== undefined) {
            updatedFields.nume = name;
          }
          if (stareCivila !== undefined) {
            updatedFields.stareCivila = stareCivila;
          }
          if (zileConcediu !== undefined) {
            updatedFields.zileConcediu = zileConcediu;
          }

          setWorker((prevWorker) => {
            return {...prevWorker, ...updatedFields };
          });

          setHasChanged(false)
        })
        .catch((e) => {
          console.log('Error updating doccument:', e)
        })
    }

    function saveNewBarcode(){
      const ref = doc(db, `barcodes`, barcode)

      const data = {
        nume: name === undefined ? `Necompletat` : name,
        job: job === undefined ? `Necompletat` : job,
        copii: copii === undefined ? '0' : copii,
        stareCivila: stareCivila === undefined ? `Necompletat` : stareCivila,
        zileConcediu: zileConcediu === undefined ? '0' : zileConcediu
      }

      setDoc(ref, data)

      setWorker(data)
    }

    console.log(name)
    
    console

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

    <AnimatePresence >
      {modal && (
        <motion.div 
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.3}}
        className='modal'>
          <div className='overlay' onClick={openModal}></div>
            <div className='modal-content modal1 '>
              <h1>Schimbati Date / Informatii pentru <span className='modal__content__dynamicName'>{worker.nume} ({barcode})</span></h1>

          <div className="deliveryAddress_inputs">
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={initialName} onChange={nameHandler}></input>
              <span>Nume</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={initialJob} onChange={jobHandler}></input>
              <span>Functie</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={initialStareCivila} onChange={stareCivilaHandler}></input>
              <span>Stare Civila</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={initialCopii} onChange={copiiHandler}></input>
              <span>Copii</span>
            </div>
            
            <div className='deliveryAddress_inputs__input' >
              <input required='required' defaultValue={initialZileConcediu} onChange={zileConcediuHandler}></input>
              <span>Zile Concediu</span>
            </div>

          </div>

          <div className='modal__buttons'>
            <button  onClick={saveChanges} disabled={!hasChanged}>Save</button>
            <button  onClick={openModal}>Cancel</button>
          </div>

            </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence >
      {modal2 && (
        <motion.div 
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.3}}
        className='modal'>
          <div className='overlay' onClick={openModal2}></div>
            <div className='modal-content modal2'>
              <h1>Ce angajat vrei sa adaugi pe codul de bare &quot;<span>{barcode}</span>&quot; ?</h1>

            <div className="deliveryAddress_inputs">
              
              <div className='deliveryAddress_inputs__input' >
                <input required='required' onChange={nameHandler}></input>
                <span>Nume</span>
              </div>
              
              <div className='deliveryAddress_inputs__input' >
                <input required='required' onChange={jobHandler}></input>
                <span>Functie</span>
              </div>
              
              <div className='deliveryAddress_inputs__input' >
                <input required='required' onChange={stareCivilaHandler}></input>
                <span>Stare Civila</span>
              </div>
              
              <div className='deliveryAddress_inputs__input' >
                <input required='required' onChange={copiiHandler}></input>
                <span>Copii</span>
              </div>
              
              <div className='deliveryAddress_inputs__input' >
                <input required='required' onChange={zileConcediuHandler}></input>
                <span>Zile Concediu</span>
              </div>

            </div>

          <div className='modal__buttons'>
            <button disabled={!name && !job && !stareCivila && !copii && !zileConcediu} onClick={() => {saveNewBarcode(); openModal2();}}>Save</button>
            <button onClick={() => {toggleCamera(); openModal2()}}>Cancel</button>
          </div>

            </div>
        </motion.div>
      )}
      </AnimatePresence>


    {barcode && Object.keys(worker).length > 0 && (
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
            <button onClick={openModal}>Adaugati / Schimbati Informatii</button>
          </div>
        </section>
    

    <section className='acteSection'>
      <p className='acteActionP' onClick={() => openSection('CI')}>C.I.</p>
      <div>
        <AnimatePresence>
        {isOpen === 'CI' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.ci ? 
            <>
              <iframe src={worker.ci} width={900} height={500} title='workerCi'></iframe>
              <button onClick={() => deleteImagesOrPdfs('ci')} >Stergeti C.I.</button>
            </>

            :
              <div className='acteSectionNotAvailable'>
                <p>Nu exista C.I.</p>
              </div>
            }

          
            <input type='file' name='ci' id='ci' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('ci')} >Incarcati C.I!</button>
          
          </motion.div>
        }
        </AnimatePresence>
      </div>

        <p className='acteActionP' onClick={() => openSection('contractDeMunca')}>Contract De Munca</p>
      <div>
      <AnimatePresence>
        {isOpen === 'contractDeMunca' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.contractDeMunca ?             
              <iframe src={worker.contractDeMunca} title='workerContract' width={900} height={500}></iframe>
            
            :

            <div className='acteSectionNotAvailable'>
            <p>Nu exista Contract De Munca.</p>
            </div>
          }
          <div id='acteSectionButtons'>
            <button onClick={() => deleteImagesOrPdfs('contractDeMunca')}>Stergeti Contract</button>
            <input type='file' name='contractDeMunca' id='contractDeMunca' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('contractDeMunca')}>Incarcati Contract!</button>
          </div>
          </motion.div>
        }
        </AnimatePresence>
      </div>
      
        <p className='acteActionP' onClick={() => openSection('permis')}>Permis</p>
      <div>
      <AnimatePresence>
        {isOpen === 'permis' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >

            {worker.permis ? 
            <>
              <iframe src={worker.permis} title='workerContract' width={900} height={500}></iframe>
              <button onClick={() => deleteImagesOrPdfs('permis')}>Stergeti Permis</button>
            </>

            :

            <div className='acteSectionNotAvailable'>
              <p>Nu exista Permis.</p>
            </div>
            }

            <input type='file' name='permis' id='permis' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('permis')}>Incarcati Permis!</button>
          </motion.div>
        }
        </AnimatePresence>
      </div>
      
        <p className='acteActionP' onClick={() => openSection('acteStudii')}>Acte Studii</p>
      <div>
      <AnimatePresence>
        {isOpen === 'acteStudii' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.acteStudii ? 
            <>
            <iframe src={worker.acteStudii} title='workerContract' width={900} height={500}></iframe>
            <button onClick={() => deleteImagesOrPdfs('acteStudii')}>Stergeti Acte Studii</button>
            </>

            :

            <div className='acteSectionNotAvailable'>
              <p>Nu exista Acte de Studii.</p>
            </div>
          }

            <input type='file' name='acteStudii' id='acteStudii' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('acteStudii')}>Incarcati Acte Studii!</button>
          </motion.div>
        }
        </AnimatePresence>
      </div>
      
        <p className='acteActionP' onClick={() => openSection('fisaPostului')}>Fisa Postului</p>
      <div>
      <AnimatePresence>
        {isOpen === 'fisaPostului' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.fisaPostului ? 
            <>
              <iframe src={worker.fisaPostului} title='workerContract' width={900} height={500}></iframe>
              <button onClick={() => deleteImagesOrPdfs('fisaPostului')}>Stergeti Fisa Postului</button>
            </>
            
            :

            <div className='acteSectionNotAvailable'>
              <p>Nu exista Fisa Postului.</p>
            </div>
          
          }

            <input type='file' name='fisaPostului' id='fisaPostului' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('fisaPostului')}>Incarcati Fisa Postului!</button>
          </motion.div>
        }
        </AnimatePresence>
      </div>
      
        <p className='acteActionP' onClick={() => openSection('adeverintaMedicala')}>Adeverinta Medicala</p>
      <div>
      <AnimatePresence>
        {isOpen === 'adeverintaMedicala' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.adeverintaMedicala ? 
            <>
              <iframe src={worker.adeverintaMedicala} title='workerContract' width={900} height={500}></iframe>
              <button onClick={() => deleteImagesOrPdfs('adeverintaMedicala')}>Stergeti Adeverinta Medicala</button>
            </>
            
            :

            <div className='acteSectionNotAvailable'>
              <p>Nu exista Adeverinta Medicala.</p>
            </div>
            }

            <input type='file' name='adeverintaMedicala' id='adeverintaMedicala' onChange={handleChange} accept='image/*, .pdf'></input>
            <button onClick={() => handleUpload('adeverintaMedicala')}>Incarcati Adeverinta Medicala!</button>
          </motion.div>
        }
        </AnimatePresence>
      </div>
      
        <p className='acteActionP' onClick={() => openSection('cazier')}>Cazier</p>
      <div>
      <AnimatePresence>
        {isOpen === 'cazier' &&
          <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          transition={{duration: 0.3}}
          >
            {worker.cazier ? 
            <>
              <iframe src={worker.cazier} title='workerContract'></iframe>
              <button onClick={() => deleteImagesOrPdfs('cazier')}>Stergeti Cazier</button>
            </>
            
            :

            <div className='acteSectionNotAvailable'>
              <p>Nu exista Cazier.</p>
            </div>
          }

            <input type='file' name='cazier' id='cazier' onChange={handleChange} accept='image/*, .pdf'></input>
            {file && 
            <button onClick={() => handleUpload('cazier')}>Incarcati Cazier!</button>
            }
          </motion.div>
        }
        </AnimatePresence>
      </div>
      </section>
      </>
      )}

    </section>
  )
};

export default Home;