import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

function SensorForm() {
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    active: true,
    access_token: '',
    description: '',
    attributes_metadata: [{ name: '', type: 'number', unit: '', notifications: [] }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributeChange = (index, field, value) => {
    setFormData((prev) => {
      const newAttributes = [...prev.attributes_metadata];
      newAttributes[index] = { ...newAttributes[index], [field]: value };
      return { ...prev, attributes_metadata: newAttributes };
    });
  };

  const handleNotificationChange = (attrIndex, notifIndex, field, value) => {
    setFormData((prev) => {
      const newAttributes = [...prev.attributes_metadata];
      const newNotifications = [...newAttributes[attrIndex].notifications];
      newNotifications[notifIndex] = { ...newNotifications[notifIndex], [field]: value };
      newAttributes[attrIndex] = { ...newAttributes[attrIndex], notifications: newNotifications };
      return { ...prev, attributes_metadata: newAttributes };
    });
  };

  const addAttribute = () => {
    setFormData((prev) => ({
      ...prev,
      attributes_metadata: [
        ...prev.attributes_metadata,
        { name: '', type: 'number', unit: '', notifications: [] },
      ],
    }));
  };

  const addNotification = (attrIndex) => {
    setFormData((prev) => {
      const newAttributes = [...prev.attributes_metadata];
      newAttributes[attrIndex].notifications.push({
        condition: 'none',
        value: '',
        min: '',
        max: '',
        alarm_type: 'common',
        message: '',
      });
      return { ...prev, attributes_metadata: newAttributes };
    });
  };

  const removeAttribute = (index) => {
    setFormData((prev) => {
      const newAttributes = prev.attributes_metadata.filter((_, i) => i !== index);
      return { ...prev, attributes_metadata: newAttributes };
    });
  };

  const removeNotification = (attrIndex, notifIndex) => {
    setFormData((prev) => {
      const newAttributes = [...prev.attributes_metadata];
      newAttributes[attrIndex].notifications = newAttributes[attrIndex].notifications.filter(
        (_, i) => i !== notifIndex
      );
      return { ...prev, attributes_metadata: newAttributes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        active: formData.active === 'true' || formData.active === true,
        attributes_metadata: formData.attributes_metadata.map((attr) => ({
          ...attr,
          notifications: attr.notifications.map((notif) => {
            if (notif.condition === 'range') {
              return { ...notif, min: notif.min, max: notif.max };
            } else if (notif.condition !== 'none') {
              return { ...notif, value: notif.value };
            }
            return notif;
          }),
        })),
      };
      await axios.post('http://localhost:5000/sensors', payload);
      toast({
        title: 'Sucesso',
        description: 'Sensor criado com sucesso!',
        variant: 'default',
        duration: 3000,
      });
      setFormData({
        identifier: '',
        name: '',
        active: true,
        access_token: '',
        description: '',
        attributes_metadata: [{ name: '', type: 'number', unit: '', notifications: [] }],
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar sensor: ' + (err.response?.data?.error || err.message),
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Criar Sensor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid-cols-3 gap-x-4 items-center">
            <Label htmlFor="identifier" className="text-right">Identificador</Label>
            <Input
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              className="col-span-2"
              required
            />
          </div>
          <div className="grid-cols-3 gap-x-4 items-center">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="col-span-2"
              required
            />
          </div>
          <div className="grid-cols-3 gap-x-4 items-center">
            <Label htmlFor="active" className="text-right">Ativo</Label>
            <Select
              value={formData.active.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, active: value === 'true' }))}
              className="col-span-2"
            >
              <SelectTrigger id="active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid-cols-3 gap-x-4 items-center">
            <Label htmlFor="access_token" className="text-right">Token de Acesso</Label>
            <Input
              id="access_token"
              name="access_token"
              value={formData.access_token}
              onChange={handleInputChange}
              className="col-span-2"
              required
            />
          </div>
          <div className="grid-cols-3 gap-x-4 items-center">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="col-span-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Atributos</Label>
            {formData.attributes_metadata.map((attr, attrIndex) => (
              <div key={attrIndex} className="border p-4 rounded-md space-y-2">
                <div className="grid-cols-3 gap-x-4 items-center">
                  <Label htmlFor={`attr-name-${attrIndex}`} className="text-right">Nome</Label>
                  <Input
                    id={`attr-name-${attrIndex}`}
                    value={attr.name}
                    onChange={(e) => handleAttributeChange(attrIndex, 'name', e.target.value)}
                    className="col-span-2"
                    required
                  />
                </div>
                <div className="grid-cols-3 gap-x-4 items-center">
                  <Label htmlFor={`attr-type-${attrIndex}`} className="text-right">Tipo</Label>
                  <Select
                    value={attr.type}
                    onValueChange={(value) => handleAttributeChange(attrIndex, 'type', value)}
                    className="col-span-2"
                  >
                    <SelectTrigger id={`attr-type-${attrIndex}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="boolean">Booleano</SelectItem>
                      <SelectItem value="string">Texto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid-cols-3 gap-x-4 items-center">
                  <Label htmlFor={`attr-unit-${attrIndex}`} className="text-right">Unidade</Label>
                  <Input
                    id={`attr-unit-${attrIndex}`}
                    value={attr.unit}
                    onChange={(e) => handleAttributeChange(attrIndex, 'unit', e.target.value)}
                    className="col-span-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notificações</Label>
                  {attr.notifications.map((notif, notifIndex) => (
                    <div key={notifIndex} className="border p-2 rounded-md space-y-2">
                      <div className="grid-cols-3 gap-x-4 items-center">
                        <Label htmlFor={`notif-condition-${attrIndex}-${notifIndex}`} className="text-right">Condição</Label>
                        <Select
                          value={notif.condition}
                          onValueChange={(value) => handleNotificationChange(attrIndex, notifIndex, 'condition', value)}
                          className="col-span-2"
                        >
                          <SelectTrigger id={`notif-condition-${attrIndex}-${notifIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            <SelectItem value="range">Intervalo</SelectItem>
                            <SelectItem value="greater_than">Maior que</SelectItem>
                            <SelectItem value="less_than">Menor que</SelectItem>
                            <SelectItem value="equal_to">Igual a</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {notif.condition === 'range' && (
                        <>
                          <div className="grid-cols-3 gap-x-4 items-center">
                            <Label htmlFor={`notif-min-${attrIndex}-${notifIndex}`} className="text-right">Mínimo</Label>
                            <Input
                              id={`notif-min-${attrIndex}-${notifIndex}`}
                              type="number"
                              value={notif.min}
                              onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'min', e.target.value)}
                              className="col-span-2"
                            />
                          </div>
                          <div className="grid-cols-3 gap-x-4 items-center">
                            <Label htmlFor={`notif-max-${attrIndex}-${notifIndex}`} className="text-right">Máximo</Label>
                            <Input
                              id={`notif-max-${attrIndex}-${notifIndex}`}
                              type="number"
                              value={notif.max}
                              onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'max', e.target.value)}
                              className="col-span-2"
                            />
                          </div>
                        </>
                      )}
                      {['greater_than', 'less_than', 'equal_to'].includes(notif.condition) && (
                        <div className="grid-cols-3 gap-x-4 items-center">
                          <Label htmlFor={`notif-value-${attrIndex}-${notifIndex}`} className="text-right">Valor</Label>
                          <Input
                            id={`notif-value-${attrIndex}-${notifIndex}`}
                            type={attr.type === 'number' ? 'number' : 'text'}
                            value={notif.value}
                            onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'value', e.target.value)}
                            className="col-span-2"
                          />
                        </div>
                      )}
                      <div className="grid-cols-3 gap-x-4 items-center">
                        <Label htmlFor={`notif-alarm-${attrIndex}-${notifIndex}`} className="text-right">Tipo de Alarme</Label>
                        <Select
                          value={notif.alarm_type}
                          onValueChange={(value) => handleNotificationChange(attrIndex, notifIndex, 'alarm_type', value)}
                          className="col-span-2"
                        >
                          <SelectTrigger id={`notif-alarm-${attrIndex}-${notifIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Comum</SelectItem>
                            <SelectItem value="attention">Atenção</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid-cols-3 gap-x-4 items-center">
                        <Label htmlFor={`notif-message-${attrIndex}-${notifIndex}`} className="text-right">Mensagem</Label>
                        <Input
                          id={`notif-message-${attrIndex}-${notifIndex}`}
                          value={notif.message}
                          onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'message', e.target.value)}
                          className="col-span-2"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeNotification(attrIndex, notifIndex)}
                        className="mt-2"
                      >
                        Remover Notificação
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => addNotification(attrIndex)}
                    className="mt-2"
                  >
                    Adicionar Notificação
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeAttribute(attrIndex)}
                  className="mt-2"
                >
                  Remover Atributo
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addAttribute}>
              Adicionar Atributo
            </Button>
          </div>
          <Button type="submit">Criar Sensor</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SensorForm;