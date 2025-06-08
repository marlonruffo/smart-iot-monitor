import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ViewReadings() {
  const [formData, setFormData] = useState({ identifier: '', chartType: 'line' });
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
        console.log('Fetched readings:', response.data);
        setReadings(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching readings:', err);
        setError(`Erro ao carregar leituras para o sensor ${formData.identifier}.`);
        setReadings([]);
      }
    };
    fetchReadings();
  }, [formData.identifier]);

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const selectedSensor = sensors.find(s => s.identifier === formData.identifier);
  const attributeKeys = selectedSensor?.attributes_metadata.map(attr => attr.name) || [];
  const numericalAttributes = useMemo(() => {
    return selectedSensor?.attributes_metadata
      .filter(attr => attr.type === 'number')
      .map(attr => attr.name) || [];
  }, [selectedSensor]);

  const chartOption = useMemo(() => {
    if (!formData.identifier || readings.length === 0 || numericalAttributes.length === 0) {
      return {};
    }

    const timestamps = readings.map(reading =>
      new Date(reading.timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    const series = numericalAttributes.map(attr => ({
      name: attr,
      type: formData.chartType,
      data: readings.map(reading => reading.attributes[attr] ?? null),
      smooth: formData.chartType === 'line',
    }));

    return {
      title: { text: `Leituras do Sensor ${formData.identifier}`, left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: numericalAttributes, top: 'bottom' },
      xAxis: { type: 'category', data: timestamps },
      yAxis: { type: 'value' },
      series,
      dataZoom: [
        { type: 'slider', start: 0, end: 100 },
        { type: 'inside', start: 0, end: 100 },
      ],
    };
  }, [formData.identifier, formData.chartType, readings, numericalAttributes]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Visualizar Leituras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="ap-x-4 gap-y-6 items-center">
            <Label htmlFor="identifier" className="text-right font-medium">Sensor</Label>
            <div className="col-span-2">
              <Select
                name="identifier"
                value={formData.identifier}
                onValueChange={(value) => handleSelectChange('identifier', value)}
                disabled={sensors.length === 0}
              >
                <SelectTrigger id="identifier">
                  <SelectValue placeholder="Selecione um sensor" />
                </SelectTrigger>
                <SelectContent className="z-50">
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
          </div>
          {formData.identifier && numericalAttributes.length > 0 && (
            <div className="gap-x-4 gap-y-6 items-center">
              <Label htmlFor="chartType" className="text-right font-medium">Tipo de Gráfico</Label>
              <div className="col-span-2">
                <Select
                  name="chartType"
                  value={formData.chartType}
                  onValueChange={(value) => handleSelectChange('chartType', value)}
                >
                  <SelectTrigger id="chartType">
                    <SelectValue placeholder="Selecione um tipo de gráfico" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="line">Linha</SelectItem>
                    <SelectItem value="bar">Barra</SelectItem>
                    <SelectItem value="scatter">Dispersão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {formData.identifier && numericalAttributes.length > 0 && readings.length > 0 && (
            <div className="mt-6">
              <ReactECharts
                option={chartOption}
                style={{ height: '400px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                lazyUpdate={true}
              />
            </div>
          )}
          {formData.identifier && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Leituras do Sensor {formData.identifier}</h3>
              {readings.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhuma leitura encontrada.</p>
              ) : (
                <Table>
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