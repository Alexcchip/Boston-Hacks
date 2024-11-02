// Button.js
import React from 'react';

function Button({ text }) {
  const handleClick = () => {
    alert(`Button clicked!`);
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {text}
    </button>
  );
}

export default Button;
