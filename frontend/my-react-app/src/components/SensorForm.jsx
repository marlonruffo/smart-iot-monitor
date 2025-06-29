import React, { useState } from 'react';
import { Shuffle, Copy } from 'lucide-react';
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


  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado',
        description: 'Token copiado para a área de transferência.',
        variant: 'default',
        duration: 5,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o token.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };


  const generateToken = (length = 48) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

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
        attributes_metadata: [{ name: '', type: '', unit: '', notifications: [] }],
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
    <Card className="max-w-3xl mx-auto p-6 shadow-md rounded-2xl bg-white">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-semibold text-gray-800">Criar Sensor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Identificador</Label>
              <Input name="identifier" value={formData.identifier} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Nome</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Ativo</Label>
              <Select
                value={formData.active.toString()}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, active: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Token de Acesso</Label>
              <div className="flex gap-2">
                <Input
                  name="access_token"
                  value={formData.access_token}
                  onChange={handleInputChange}
                  required
                />
                {formData.access_token ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.access_token)}
                    aria-label="Copiar token"
                    className="flex items-center justify-center px-3"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, access_token: generateToken() }))
                    }
                    aria-label="Gerar token"
                    className="flex items-center justify-center px-3"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Input name="description" value={formData.description} onChange={handleInputChange} />
            </div>
          </div>

          {/* Atributos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Atributos</Label>
              <Button
                type="button"
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                onClick={addAttribute}
              >
                Adicionar Atributo
              </Button>
            </div>

            {formData.attributes_metadata.map((attr, attrIndex) => (
              <div key={attrIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(attrIndex, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={attr.type}
                      onValueChange={(value) => handleAttributeChange(attrIndex, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                        <SelectItem value="string">Texto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      value={attr.unit}
                      onChange={(e) => handleAttributeChange(attrIndex, 'unit', e.target.value)}
                    />
                  </div>
                </div>

                {/* Notificações */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Notificações</Label>
                    <Button
                      type="button"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                      onClick={() => addNotification(attrIndex)}
                    >
                      Adicionar Notificação
                    </Button>
                  </div>

                  {attr.notifications.map((notif, notifIndex) => (
                    <div key={notifIndex} className="border border-gray-300 rounded-lg p-3 bg-white space-y-3">
                      <div>
                        <Label>Condição</Label>
                        <Select
                          value={notif.condition}
                          onValueChange={(value) => handleNotificationChange(attrIndex, notifIndex, 'condition', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Condição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="range">Intervalo</SelectItem>
                            <SelectItem value="greater_than">Maior que</SelectItem>
                            <SelectItem value="less_than">Menor que</SelectItem>
                            <SelectItem value="equal_to">Igual a</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {notif.condition === 'range' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>Mínimo</Label>
                            <Input
                              type="number"
                              value={notif.min}
                              onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'min', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Máximo</Label>
                            <Input
                              type="number"
                              value={notif.max}
                              onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'max', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {['greater_than', 'less_than', 'equal_to'].includes(notif.condition) && (
                        <div>
                          <Label>Valor</Label>
                          <Input
                            type={attr.type === 'number' ? 'number' : 'text'}
                            value={notif.value}
                            onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'value', e.target.value)}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Tipo de Alarme</Label>
                          <Select
                            value={notif.alarm_type}
                            onValueChange={(value) => handleNotificationChange(attrIndex, notifIndex, 'alarm_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Alarme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Comum</SelectItem>
                              <SelectItem value="attention">Atenção</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Mensagem</Label>
                          <Input
                            value={notif.message}
                            onChange={(e) => handleNotificationChange(attrIndex, notifIndex, 'message', e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="bg-red-100 text-red-800 hover:bg-red-200 transition"
                        size="sm"
                        onClick={() => removeNotification(attrIndex, notifIndex)}
                      >
                        Remover Notificação
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  className="bg-red-100 text-red-800 hover:bg-red-200 transition"
                  size="sm"
                  onClick={() => removeAttribute(attrIndex)}
                >
                  Remover Atributo
                </Button>
              </div>
            ))}
          </div>

          {/* Botão Final */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Criar Sensor
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SensorForm;