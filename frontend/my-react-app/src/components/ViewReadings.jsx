import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileSpreadsheet, FileText, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const socket = io('http://localhost:5000');

function ViewReadings() {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('');
  const [readings, setReadings] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('last-hour');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReadings, setShowReadings] = useState(false);
  const [readingPage, setReadingPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [notificationType, setNotificationType] = useState('urgent');
  const [condition, setCondition] = useState('greater_than');
  const [threshold, setThreshold] = useState('');
  const [message, setMessage] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
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
      if (alert.sensor_id === selectedSensor) {
        setNotifications((prev) => [alert, ...prev].slice(0, 100));
        toast({
          title: `Alerta: ${alert.attribute}`,
          description: `${alert.message} (Valor: ${alert.value}, Condição: ${alert.condition} ${alert.threshold})`,
          variant: alert.alarm_type === 'urgent' ? 'destructive' : alert.alarm_type === 'attention' ? 'warning' : 'default',
          duration: 5000,
        });
      }
    });

    return () => {
      socket.off('new_reading');
      socket.off('alert');
    };
  }, [selectedSensor]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (selectedSensor) {
        try {
          const response = await axios.get(`http://localhost:5000/notifications/${selectedSensor}`);
          setNotifications(response.data);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      } else {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [selectedSensor]);

  const handleSensorChange = async (value) => {
    setSelectedSensor(value);
    setReadingPage(1);
    setNotificationPage(1);
    if (value) {
      await fetchReadings(value, timeRange, customStart, customEnd);
    } else {
      setReadings([]);
    }
  };

  const fetchReadings = async (identifier, range, start = '', end = '') => {
    try {
      const params = {};
      if (range === 'custom' && start && end) {
        params.start_time = start;
        params.end_time = end;
      } else if (range !== 'all') {
        const now = new Date();
        let startTime;
        switch (range) {
          case 'last-hour':
            startTime = new Date(now - 1 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-day':
            startTime = new Date(now - 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-week':
            startTime = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          default:
            startTime = '';
        }
        params.start_time = startTime;
      }
      const response = await axios.get(`http://localhost:5000/readings/${identifier}`, { params });
      setReadings(response.data);
    } catch (err) {
      console.error('Error fetching readings:', err);
    }
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    setReadingPage(1);
    if (selectedSensor) {
      fetchReadings(selectedSensor, value, customStart, customEnd);
    }
  };

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault();
    setReadingPage(1);
    if (selectedSensor) {
      fetchReadings(selectedSensor, 'custom', customStart, customEnd);
    }
  };

  const downloadCSV = async () => {
    if (!selectedSensor) return;

    try {
      const params = {};
      if (timeRange === 'custom' && customStart && customEnd) {
        params.start_time = customStart;
        params.end_time = customEnd;
      } else if (timeRange !== 'all') {
        const now = new Date();
        let startTime;
        switch (timeRange) {
          case 'last-hour':
            startTime = new Date(now - 1 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-day':
            startTime = new Date(now - 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-week':
            startTime = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          default:
            startTime = '';
        }
        params.start_time = startTime;
      }
      const response = await axios.get(`http://localhost:5000/readings/csv/${selectedSensor}`, {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedSensor}_readings.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Sucesso',
        description: 'Arquivo CSV baixado com sucesso!',
        variant: 'default',
        duration: 3000,
      });
    } catch (err) {
      console.error('Error downloading CSV:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao baixar o arquivo CSV.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const getChartData = () => {
    if (!selectedSensor || readings.length === 0) return null;

    const sensor = sensors.find((s) => s.identifier === selectedSensor);
    if (!sensor) return null;

    const numericAttributes = sensor.attributes_metadata.filter((attr) => attr.type === 'number').map((attr) => attr.name);
    const reversedReadings = [...readings].reverse(); 
    const labels = reversedReadings.map((r) => new Date(r.timestamp).toLocaleTimeString());
    const datasets = numericAttributes.map((attr, index) => ({
      label: `${attr} (${sensor.attributes_metadata.find((a) => a.name === attr).unit})`,
      data: reversedReadings.map((r) => r.attributes[attr] ?? null), // Use reversed data
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

  const itemsPerPage = 10;
  const paginatedReadings = readings.slice((readingPage - 1) * itemsPerPage, readingPage * itemsPerPage);
  const totalReadingPages = Math.ceil(readings.length / itemsPerPage);
  const paginatedNotifications = notifications.slice((notificationPage - 1) * itemsPerPage, notificationPage * itemsPerPage);
  const totalNotificationPages = Math.ceil(notifications.length / itemsPerPage);

  const handleSaveNotification = async () => {
    if (!selectedSensor || !selectedAttribute || !condition || !threshold) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    const sensor = sensors.find((s) => s.identifier === selectedSensor);
    if (!sensor) return;

    const attributeMeta = sensor.attributes_metadata.find((attr) => attr.name === selectedAttribute);
    let updatedNotifications = attributeMeta ? [...attributeMeta.notifications] : [];

    if (editingIndex !== null) {
      // Edit existing notification
      updatedNotifications[editingIndex] = {
        condition,
        value: condition === 'range' ? '' : threshold,
        min: condition === 'range' ? threshold.split('-')[0] : '',
        max: condition === 'range' ? threshold.split('-')[1] : '',
        alarm_type: notificationType,
        message: message || `Alerta ${notificationType} para ${selectedAttribute}`,
      };
    } else {
      // Add new notification
      updatedNotifications.push({
        condition,
        value: condition === 'range' ? '' : threshold,
        min: condition === 'range' ? threshold.split('-')[0] : '',
        max: condition === 'range' ? threshold.split('-')[1] : '',
        alarm_type: notificationType,
        message: message || `Alerta ${notificationType} para ${selectedAttribute}`,
      });
    }

    const updatedSensor = {
      ...sensor,
      attributes_metadata: sensor.attributes_metadata.map((attr) =>
        attr.name === selectedAttribute ? { ...attr, notifications: updatedNotifications } : attr
      ),
    };

    try {
      await axios.put(`http://localhost:5000/sensors/${selectedSensor}`, updatedSensor);
      toast({
        title: 'Sucesso',
        description: editingIndex !== null ? 'Notificação atualizada!' : 'Notificação adicionada!',
        variant: 'default',
        duration: 3000,
      });
      setShowNotificationModal(false);
      // Refresh sensors list
      const response = await axios.get('http://localhost:5000/sensors');
      setSensors(response.data);
    } catch (err) {
      console.error('Error updating sensor:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar a notificação.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleEditNotification = (index, attr) => {
    const sensor = sensors.find((s) => s.identifier === selectedSensor);
    const notification = sensor.attributes_metadata.find((a) => a.name === attr).notifications[index];
    setSelectedAttribute(attr);
    setNotificationType(notification.alarm_type);
    setCondition(notification.condition);
    setThreshold(notification.condition === 'range' ? `${notification.min}-${notification.max}` : notification.value);
    setMessage(notification.message);
    setEditingIndex(index);
    setShowNotificationModal(true);
  };

  const handleRemoveNotification = async (attr, index) => {
    const sensor = sensors.find((s) => s.identifier === selectedSensor);
    const updatedNotifications = sensor.attributes_metadata.find((a) => a.name === attr).notifications.filter((_, i) => i !== index);

    const updatedSensor = {
      ...sensor,
      attributes_metadata: sensor.attributes_metadata.map((attrMeta) =>
        attrMeta.name === attr ? { ...attrMeta, notifications: updatedNotifications } : attrMeta
      ),
    };

    try {
      await axios.put(`http://localhost:5000/sensors/${selectedSensor}`, updatedSensor);
      toast({
        title: 'Sucesso',
        description: 'Notificação removida!',
        variant: 'default',
        duration: 3000,
      });
      // Refresh sensors list
      const response = await axios.get('http://localhost:5000/sensors');
      setSensors(response.data);
    } catch (err) {
      console.error('Error removing notification:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao remover a notificação.',
        variant: 'destructive',
        duration: 5000,
      });
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
            <SelectContent>
              {sensors.map((sensor) => (
                <SelectItem key={sensor.identifier} value={sensor.identifier}>
                  {sensor.name} ({sensor.identifier})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-x-4 items-center">
          <label htmlFor="time-range" className="text-right font-medium">Intervalo de Tempo</label>
          <Select value={timeRange} onValueChange={handleTimeRangeChange} className="col-span-2">
            <SelectTrigger id="time-range">
              <SelectValue placeholder="Selecione o intervalo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-hour">Última hora</SelectItem>
              <SelectItem value="last-day">Último dia</SelectItem>
              <SelectItem value="last-week">Última semana</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {timeRange === 'custom' && (
          <form onSubmit={handleCustomRangeSubmit} className="mb-4 grid grid-cols-3 gap-4 items-center">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Data Inicial</label>
              <Input type="datetime-local" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Data Final</label>
              <Input type="datetime-local" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1"> </label>
              <Button type="submit" className="w-full">Aplicar</Button>
            </div>
          </form>
        )}
        {readings.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-x-4 items-center">
            <label htmlFor="chart-type" className="text-right font-medium">Tipo de Gráfico</label>
            <Select value={chartType} onValueChange={setChartType} className="col-span-2">
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Selecione o tipo de gráfico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="bar">Barra</SelectItem>
                <SelectItem value="scatter">Dispersão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {readings.length > 0 && (
          <div className="mb-4">
            <div className="h-96">{renderChart()}</div>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => setShowReadings(!showReadings)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <FileText className="w-4 h-4" /> {showReadings ? 'Ocultar Leituras do Sensor' : 'Mostrar Leituras do Sensor'}
              </Button>
              <Button onClick={() => setShowNotifications(!showNotifications)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Bell className="w-4 h-4" /> {showNotifications ? 'Ocultar Histórico de Notificações' : 'Mostrar Histórico de Notificações'}
              </Button>
              <Button onClick={downloadCSV} disabled={!selectedSensor} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Baixar CSV
              </Button>
              <Button onClick={() => setShowNotificationModal(true)} disabled={!selectedSensor} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                <Bell className="w-4 h-4" /> Gerenciar Notificações
              </Button>
            </div>
          </div>
        )}
        {showReadings && readings.length > 0 && (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  {sensors.find((s) => s.identifier === selectedSensor)?.attributes_metadata.map((attr) => (
                    <TableHead key={attr.name}>{attr.name} ({attr.unit})</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                    {sensors.find((s) => s.identifier === selectedSensor)?.attributes_metadata.map((attr) => (
                      <TableCell key={attr.name}>
                        {typeof reading.attributes[attr.name] !== 'undefined'
                          ? (attr.type === 'boolean' ? String(reading.attributes[attr.name]) : reading.attributes[attr.name])
                          : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalReadingPages > 1 && (
              <div className="flex justify-between mt-2">
                <Button
                  onClick={() => setReadingPage((prev) => Math.max(prev - 1, 1))}
                  disabled={readingPage === 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Anterior
                </Button>
                <span>Página {readingPage} de {totalReadingPages}</span>
                <Button
                  onClick={() => setReadingPage((prev) => Math.min(prev + 1, totalReadingPages))}
                  disabled={readingPage === totalReadingPages}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}
        {showReadings && readings.length === 0 && (
          <p className="text-center">Nenhuma leitura disponível.</p>
        )}
        {showNotifications && notifications.length > 0 && (
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Atributo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Condição</TableHead>
                      <TableHead>Limiar</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotifications.map((notification, index) => {
                      const attr = sensors.find((s) => s.identifier === selectedSensor)?.attributes_metadata.find((a) => a.name === notification.attribute);
                      const notifIndex = attr?.notifications.findIndex((n) => n.condition === notification.condition && n.value === notification.threshold || (n.min === notification.threshold.split('-')[0] && n.max === notification.threshold.split('-')[1]));
                      return (
                        <TableRow
                          key={index}
                          className={
                            notification.alarm_type === 'urgent'
                              ? 'bg-destructive text-destructive-foreground'
                              : notification.alarm_type === 'attention'
                              ? 'bg-yellow-300 text-yellow-900'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          <TableCell>{new Date(notification.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{notification.attribute}</TableCell>
                          <TableCell>{notification.value}</TableCell>
                          <TableCell>{notification.condition}</TableCell>
                          <TableCell>{notification.threshold}</TableCell>
                          <TableCell>{notification.alarm_type}</TableCell>
                          <TableCell>{notification.message}</TableCell>
                          
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalNotificationPages > 1 && (
                  <div className="flex justify-between mt-2">
                    <Button
                      onClick={() => setNotificationPage((prev) => Math.max(prev - 1, 1))}
                      disabled={notificationPage === 1}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Anterior
                    </Button>
                    <span>Página {notificationPage} de {totalNotificationPages}</span>
                    <Button
                      onClick={() => setNotificationPage((prev) => Math.min(prev + 1, totalNotificationPages))}
                      disabled={notificationPage === totalNotificationPages}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {showNotifications && notifications.length === 0 && (
          <p className="text-center mt-4">Nenhuma notificação disponível.</p>
        )}
        <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIndex !== null ? 'Editar Notificação' : 'Adicionar Notificação'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="attribute-select" className="text-right">Atributo</label>
                <Select value={selectedAttribute} onValueChange={setSelectedAttribute} className="col-span-3">
                  <SelectTrigger id="attribute-select">
                    <SelectValue placeholder="Selecione um atributo" />
                  </SelectTrigger>
                  <SelectContent>
                    {sensors.find((s) => s.identifier === selectedSensor)?.attributes_metadata.map((attr) => (
                      <SelectItem key={attr.name} value={attr.name}>
                        {attr.name} ({attr.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type-select" className="text-right">Tipo</label>
                <Select value={notificationType} onValueChange={setNotificationType} className="col-span-3">
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="attention">Atenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="condition-select" className="text-right">Condição</label>
                <Select value={condition} onValueChange={setCondition} className="col-span-3">
                  <SelectTrigger id="condition-select">
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater_than">Maior que</SelectItem>
                    <SelectItem value="less_than">Menor que</SelectItem>
                    <SelectItem value="range">Intervalo</SelectItem>
                    <SelectItem value="equal_to">Igual a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="threshold-input" className="text-right">Limiar</label>
                <Input
                  id="threshold-input"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={condition === 'range' ? 'min-max (ex: 10-20)' : 'Valor (ex: 50)'}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message-input" className="text-right">Mensagem</label>
                <Input
                  id="message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensagem opcional"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowNotificationModal(false)} variant="outline">Cancelar</Button>
              <Button onClick={handleSaveNotification}>{editingIndex !== null ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ViewReadings;