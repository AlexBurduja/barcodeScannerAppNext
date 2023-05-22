import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';

import { db } from './FirebaseConfig';

const WorkerForm = ({ barcode }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save worker information to Firestore
      const workerDocRef = doc(db, 'workers', barcode);
      await setDoc(workerDocRef, {
        name,
        position,
        department,
      });

      console.log('Worker information saved to Firestore.');
      setName('');
      setPosition('');
      setDepartment('');
    } catch (error) {
      console.error('Error saving worker information:', error);
    }
  };

  return (
    <div>
      <h2>Worker Information</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <br />
        <label>
          Position:
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </label>
        <br />
        <label>
          Department:
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default WorkerForm;
