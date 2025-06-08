import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import SensorForm from './components/SensorForm';
import SubmitReadingForm from './components/SubmitReadingForm';
import ViewReadings from './components/ViewReadings';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <ul className="flex space-x-4">
          <li><Link to="/sensors" className="text-blue-600 hover:underline">Criar Sensor</Link></li>
          <li><Link to="/submit-reading" className="text-blue-600 hover:underline">Enviar Leitura</Link></li>
          <li><Link to="/view-readings" className="text-blue-600 hover:underline">Visualizar Leituras</Link></li>
        </ul>
      </nav>
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/sensors" element={<SensorForm />} />
          <Route path="/submit-reading" element={<SubmitReadingForm />} />
          <Route path="/view-readings" element={<ViewReadings />} />
          <Route path="/" element={<div><h1>Bem-vindo ao Monitor IoT</h1><p>Selecione uma opção no menu.</p></div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;