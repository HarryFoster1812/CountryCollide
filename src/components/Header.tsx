import React from 'react';

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.001.001M16.293 4.293l-.001.001M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center space-x-3">
                    <GlobeIcon />
                    <h1 className="text-2xl font-bold text-white tracking-wider">
                        Country Fusion <span className="text-cyan-400">AI</span>
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default Header;
