import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Invoice & Expense Management System
        </h1>
        <p className="text-gray-600">
          Welcome! Your application is ready to build.
        </p>
      </div>
    </div>
  );
};

export default Home;