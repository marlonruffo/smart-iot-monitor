import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ViewReadings() {
  const [formData, setFormData] = useState({ identifier: '' });
  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/sensors', {
          headers: { 'Content-Type': 'application/json' },
        });
        setSensors(response.data || []);
        if (response.data.length === 0) {
          setError('Nenhum sensor encontrado. Crie um sensor primeiro.');
        }
      } catch (err) {
        console.error('Error fetching sensors:', err);
        setError('Erro ao carregar sensores. Verifique o backend.');
      }
    };
    fetchSensors();
  }, []);

  useEffect(() => {
    const fetchReadings = async () => {
      if (!formData.identifier) {
        setReadings([]);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/readings/${formData.identifier}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Fetched readings:', response.data); // Debug log
        setReadings(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching readings:', err);
        setError(`Erro ao carregar leituras para o sensor ${formData.identifier}.`);
        setReadings([]);
      }
    };
    fetchReadings();
  }, [formData.identifier]);

  const handleSelectChange = (value) => {
    setFormData({ identifier: value });
  };

  const selectedSensor = sensors.find(s => s.identifier === formData.identifier);
  const attributeKeys = selectedSensor?.attributes_metadata.map(attr => attr.name) || [];

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle>Visualizar Leituras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Sensor</Label>
            <Select
              name="identifier"
              value={formData.identifier}
              onValueChange={handleSelectChange}
              disabled={sensors.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um sensor" />
              </SelectTrigger>
              <SelectContent>
                {sensors.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Nenhum sensor disponível
                  </div>
                ) : (
                  sensors.map((sensor) => (
                    <SelectItem key={sensor.identifier} value={sensor.identifier}>
                      {sensor.name} ({sensor.identifier})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {formData.identifier && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Leituras do Sensor {formData.identifier}</h3>
              {readings.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma leitura encontrada.</p>
              ) : (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      {attributeKeys.map(key => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell>{reading.id}</TableCell>
                        {attributeKeys.map(key => (
                          <TableCell key={key}>{reading.attributes[key] ?? 'N/A'}</TableCell>
                        ))}
                        <TableCell>{new Date(reading.timestamp).toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ViewReadings;
// 