import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import SensorForm from './components/SensorForm';
import SubmitReadingForm from './components/SubmitReadingForm';
import ViewReadings from './components/ViewReadings';
import './index.css';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg fixed w-full top-0 z-10 h-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
    <div className="flex items-center justify-between h-full">
      <span className="text-xl font-semibold">Monitor IoT</span>
      <ul className="flex space-x-4 items-center">
        <li>
          <Link to="/sensors" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-gray-200 transition duration-150 ease-in-out">
            Criar Sensor
          </Link>
        </li>
        <li>
          <Link to="/submit-reading" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-gray-200 transition duration-150 ease-in-out">
            Enviar Leitura
          </Link>
        </li>
        <li>
          <Link to="/view-readings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-gray-200 transition duration-150 ease-in-out">
            Visualizar Leituras
          </Link>
        </li>
      </ul>
    </div>
  </div>
</nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 min-h-[calc(100vh-6rem)]">
        <div className="fixed top-24 right-4 z-50">
          <Toaster />
        </div>
        <Routes>
          <Route path="/sensors" element={<SensorForm />} />
          <Route path="/submit-reading" element={<SubmitReadingForm />} />
          <Route path="/view-readings" element={<ViewReadings />} />
          <Route path="/" element={<div className="text-center mt-10"><h1 className="text-3xl font-bold">Bem-vindo ao Monitor IoT</h1><p className="mt-2 text-gray-600">Selecione uma opção no menu acima.</p></div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;