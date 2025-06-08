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
    attributes: {},
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('attributes.')) {
      const field = name.split('.')[1];
      const selectedSensor = sensors.find(s => s.identifier === formData.identifier);
      const attrMetadata = selectedSensor?.attributes_metadata.find(attr => attr.name === field);
      let parsedValue = value;
      if (attrMetadata?.type === 'number') {
        parsedValue = value ? parseFloat(value) : '';
      } else if (attrMetadata?.type === 'boolean') {
        parsedValue = value === 'true';
      }
      setFormData({
        ...formData,
        attributes: { ...formData.attributes, [field]: parsedValue },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (value) => {
    const selectedSensor = sensors.find(s => s.identifier === value);
    const newAttributes = selectedSensor?.attributes_metadata.reduce((acc, attr) => ({
      ...acc,
      [attr.name]: attr.type === 'boolean' ? false : ''
    }), {}) || {};
    setFormData({
      ...formData,
      identifier: value,
      attributes: newAttributes,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedSensor = sensors.find(s => s.identifier === formData.identifier);
    const attributes = {};
    for (const attr of selectedSensor?.attributes_metadata || []) {
      const value = formData.attributes[attr.name];
      if (value !== '' && value !== null && value !== undefined) {
        attributes[attr.name] = value;
      }
    }

    try {
      const response = await axios.post('http://localhost:5000/data', {
        identifier: formData.identifier,
        attributes,
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
        attributes: selectedSensor?.attributes_metadata.reduce((acc, attr) => ({
          ...acc,
          [attr.name]: attr.type === 'boolean' ? false : ''
        }), {}) || {},
      });
      const readingsResponse = await axios.get(`http://localhost:5000/readings/${formData.identifier}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Refreshed readings:', readingsResponse.data); // Debug log
      setReadings(Array.isArray(readingsResponse.data) ? readingsResponse.data : []);
    } catch (err) {
      console.error('Error submitting reading:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao conectar com o servidor';
      setError(`Erro: ${errorMessage}`);
      setSuccess('');
    }
  };

  const selectedSensor = sensors.find(s => s.identifier === formData.identifier);
  const attributeKeys = selectedSensor?.attributes_metadata.map(attr => attr.name) || [];

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
          {selectedSensor?.attributes_metadata.map(attr => (
            <div key={attr.name} className="space-y-2">
              <Label htmlFor={attr.name}>{attr.name} ({attr.unit || attr.type})</Label>
              {attr.type === 'boolean' ? (
                <Select
                  name={`attributes.${attr.name}`}
                  value={String(formData.attributes[attr.name])}
                  onValueChange={(value) => handleChange({ target: { name: `attributes.${attr.name}`, value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={attr.name}
                  name={`attributes.${attr.name}`}
                  type={attr.type === 'number' ? 'number' : 'text'}
                  step={attr.type === 'number' ? '0.1' : undefined}
                  value={formData.attributes[attr.name] || ''}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
          <Button type="submit" disabled={sensors.length === 0 || !formData.identifier}>Enviar Leitura</Button>
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
      </CardContent>
    </Card>
  );
}

export default ReadingForm;
//