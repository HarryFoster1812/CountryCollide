import React, { useState, useEffect } from 'react';

const loadingMessages = [
  'Consulting global atlases...',
  'Analyzing cultural synergies...',
  'Forecasting economic futures...',
  'Simulating geopolitical shifts...',
  'Drafting a new constitution...',
  'Weaving together national flags...',
];

const Loader: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-12 space-y-4">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg text-gray-400 text-center px-4">{message}</p>
    </div>
  );
};

export default Loader;
