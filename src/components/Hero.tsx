import React from 'react';

const Hero: React.FC = () => {
    return (
        <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                Imagine a New World
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Select two countries and watch as our AI analyst researches, synthesizes, and builds a detailed profile of their merged, fictional counterpart.
            </p>
        </div>
    );
}

export default Hero;
