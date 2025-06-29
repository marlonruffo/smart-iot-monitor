import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import SensorForm from './components/SensorForm';
import ReadingForm from './components/ReadingForm';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/sensors" element={<SensorForm onSensorCreated={() => {}} />} />
      <Route path="/readings" element={<ReadingForm />} />
    </Routes>
  );
}

export default AppRoutes;
//