import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const socket = io('http://localhost:5000');

function ViewReadings() {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('');
  const [readings, setReadings] = useState([]);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    // Fetch sensors
    const fetchSensors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/sensors');
        setSensors(response.data);
      } catch (err) {
        console.error('Error fetching sensors:', err);
      }
    };
    fetchSensors();

    socket.on('new_reading', (data) => {
      if (data.identifier === selectedSensor) {
        setReadings((prev) => [data, ...prev].slice(0, 100));
      }
    });

    socket.on('alert', (alert) => {
      toast({
        title: `Alerta: ${alert.attribute}`,
        description: `${alert.message} (Valor: ${alert.value}, Condição: ${alert.condition} ${alert.threshold})`,
        variant: alert.alarm_type === 'urgent' ? 'destructive' : alert.alarm_type === 'attention' ? 'warning' : 'default',
        duration: 5000,
      });
    });

    return () => {
      socket.off('new_reading');
      socket.off('alert');
    };
  }, [selectedSensor]);

  const handleSensorChange = async (value) => {
    setSelectedSensor(value);
    if (value) {
      try {
        const response = await axios.get(`http://localhost:5000/readings/${value}`);
        setReadings(response.data);
      } catch (err) {
        console.error('Error fetching readings:', err);
      }
    } else {
      setReadings([]);
    }
  };

  const getChartData = () => {
    if (!selectedSensor || readings.length === 0) return null;

    const sensor = sensors.find((s) => s.identifier === selectedSensor);
    if (!sensor) return null;

    const numericAttributes = sensor.attributes_metadata.filter((attr) => attr.type === 'number').map((attr) => attr.name);
    const labels = readings.map((r) => new Date(r.timestamp).toLocaleTimeString());
    const datasets = numericAttributes.map((attr, index) => ({
      label: `${attr} (${sensor.attributes_metadata.find((a) => a.name === attr).unit})`,
      data: readings.map((r) => r.attributes[attr] ?? null),
      borderColor: `hsl(${index * 60}, 70%, 50%)`,
      backgroundColor: `hsl(${index * 60}, 70%, 50%, 0.5)`,
      fill: chartType === 'line',
      tension: chartType === 'line' ? 0.4 : 0,
      pointRadius: chartType === 'scatter' ? 5 : 3,
    }));

    return {
      labels,
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Leituras do Sensor' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const renderChart = () => {
    const data = getChartData();
    if (!data) return null;

    switch (chartType) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Visualizar Leituras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-x-4 items-center">
          <label htmlFor="sensor-select" className="text-right font-medium">Selecionar Sensor</label>
          <Select value={selectedSensor} onValueChange={handleSensorChange} className="col-span-2">
            <SelectTrigger id="sensor-select">
              <SelectValue placeholder="Escolha um sensor" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {sensors.map((sensor) => (
                <SelectItem key={sensor.identifier} value={sensor.identifier}>
                  {sensor.name} ({sensor.identifier})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-x-4 items-center">
          <label htmlFor="chart-type" className="text-right font-medium">Tipo de Gráfico</label>
          <Select value={chartType} onValueChange={setChartType} className="col-span-2">
            <SelectTrigger id="chart-type">
              <SelectValue placeholder="Selecione o tipo de gráfico" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="bar">Barra</SelectItem>
              <SelectItem value="scatter">Dispersão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {readings.length > 0 && (
          <div className="mb-8">
            <div className="h-96">{renderChart()}</div>
          </div>
        )}
        {readings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                {sensors
                  .find((s) => s.identifier === selectedSensor)
                  ?.attributes_metadata.map((attr) => (
                    <TableHead key={attr.name}>{attr.name} ({attr.unit})</TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                  {sensors
                    .find((s) => s.identifier === selectedSensor)
                    ?.attributes_metadata.map((attr) => (
                      <TableCell key={attr.name}>{reading.attributes[attr.name] ?? '-'}</TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center">Nenhuma leitura disponível.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ViewReadings;