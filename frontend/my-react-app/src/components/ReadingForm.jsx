import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ReadingForm() {
  const [formData, setFormData] = useState({
    identifier: '',
    access_token: '',
    attributes: { temperature: '', humidity: '' },
  });
  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setReadings(response.data || []);
      } catch (err) {
        console.error('Error fetching readings:', err);
        setError(`Erro ao carregar leituras para o sensor ${formData.identifier}.`);
      }
    };
    fetchReadings();
  }, [formData.identifier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('attributes.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        attributes: { ...formData.attributes, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, identifier: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const temp = parseFloat(formData.attributes.temperature);
    const hum = parseFloat(formData.attributes.humidity);
    if (temp && (temp < -200 || temp > 200)) {
      setError('Temperatura deve estar entre -200°C e 200°C');
      return;
    }
    if (hum && (hum < -10 || hum > 200)) {
      setError('Umidade deve estar entre -10% e 200%');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/data', {
        identifier: formData.identifier,
        attributes: {
          temperature: temp || null,
          humidity: hum || null,
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': formData.access_token,
        },
      });
      setSuccess('Leitura enviada com sucesso!');
      setError('');
      setFormData({
        ...formData,
        attributes: { temperature: '', humidity: '' },
      });
      // Refresh readings after submission
      const readingsResponse = await axios.get(`http://localhost:5000/readings/${formData.identifier}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      setReadings(readingsResponse.data || []);
    } catch (err) {
      console.error('Error submitting reading:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao conectar com o servidor';
      setError(`Erro: ${errorMessage}`);
      setSuccess('');
    }
  };

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle>Enviar Leitura</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="form space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Sensor</Label>
            <Select
              name="identifier"
              value={formData.identifier}
              onValueChange={handleSelectChange}
              required
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
          <div className="space-y-2">
            <Label htmlFor="access_token">Token de Acesso</Label>
            <Input
              id="access_token"
              name="access_token"
              value={formData.access_token}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura (°C, opcional)</Label>
            <Input
              id="temperature"
              name="attributes.temperature"
              type="number"
              step="0.1"
              value={formData.attributes.temperature}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="humidity">Umidade (%, opcional)</Label>
            <Input
              id="humidity"
              name="attributes.humidity"
              type="number"
              step="0.1"
              value={formData.attributes.humidity}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" disabled={sensors.length === 0}>Enviar Leitura</Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </form>

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
                    <TableHead>Temperatura (°C)</TableHead>
                    <TableHead>Umidade (%)</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{reading.id}</TableCell>
                      <TableCell>{reading.attributes.temperature ?? 'N/A'}</TableCell>
                      <TableCell>{reading.attributes.humidity ?? 'N/A'}</TableCell>
                      <TableCell>{new Date(reading.timestamp).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReadingForm;