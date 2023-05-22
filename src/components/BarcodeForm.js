import React, { useRef, useEffect } from 'react';

const BarcodeForm = ({ onScan }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const requestCameraAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream; // Assign the stream to the video element
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    requestCameraAccess();

    return () => {
      // Stop the video stream when the component unmounts
      const stream = videoRef.current.srcObject;
      const tracks = stream?.getTracks() || [];
      tracks.forEach((track) => track.stop());
    };
  }, []);

  const handleVideoLoadedMetadata = () => {
    // Start the barcode scanning process when the video metadata is loaded
    const video = videoRef.current;
    video.play();

    // Add any necessary event listeners or processing logic here
    // For example, you can use Quagga to scan barcodes
  };

  return (
    <div className="barcode-scanner">
      <video ref={videoRef} onLoadedMetadata={handleVideoLoadedMetadata} autoPlay playsInline muted />
    </div>
  );
};

export default BarcodeForm;
