import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function SensorDetails({ identifier }) {
  const [sensor, setSensor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSensor = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/sensors/${identifier}`);
        setSensor(response.data);
        setError('');
      } catch (err) {
        console.error('Error response:', err.response);
        setError(err.response?.data?.error || `Erro ao buscar sensor: ${err.message}`);
        setSensor(null);
      }
    };
    fetchSensor();
  }, [identifier]);

  if (error) return (
    <Alert variant="destructive" className="alert">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
  if (!sensor) return <p>Carregando...</p>;

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle>Sensor: {sensor.name} ({sensor.identifier})</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Ativo:</strong> {sensor.active ? 'Sim' : 'Não'}</p>
        <p><strong>Tipo:</strong> {sensor.type}</p>
        <p><strong>Unidade:</strong> {sensor.unit}</p>
        <p><strong>Frequência:</strong> {sensor.frequency} segundos</p>
        <p><strong>Endereço:</strong> {sensor.address.street}, {sensor.address.number}, {sensor.address.complement}, {sensor.address.city}, {sensor.address.state}, {sensor.address.country} (CEP: {sensor.address.cep})</p>
        <p><strong>Última Leitura:</strong> {sensor.last_reading || 'Nenhuma'}</p>
        <h4 className="text-lg font-semibold mt-4">Leituras</h4>
        {sensor.readings.length === 0 ? (
          <p>Nenhuma leitura disponível.</p>
        ) : (
          <ul className="space-y-2">
            {sensor.readings.map((reading) => (
              <li key={reading.id} className="border-b pb-2">
                <p><strong>ID:</strong> {reading.id}</p>
                <p>Temperatura: {reading.attributes.temperature} °C, Umidade: {reading.attributes.humidity} %, Timestamp: {reading.timestamp}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default SensorDetails;