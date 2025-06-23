import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function SensorForm() {
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    active: true,
    access_token: '',
    attributes_metadata: [{ name: '', type: 'number', unit: '' }],
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...formData.attributes_metadata];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setFormData({ ...formData, attributes_metadata: newAttributes });
  };

  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes_metadata: [...formData.attributes_metadata, { name: '', type: 'number', unit: '' }],
    });
  };

  const removeAttribute = (index) => {
    if (formData.attributes_metadata.length > 1) {
      const newAttributes = formData.attributes_metadata.filter((_, i) => i !== index);
      setFormData({ ...formData, attributes_metadata: newAttributes });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.identifier || !formData.name || !formData.access_token) {
      setError('Identifier, name, and access token are required.');
      return;
    }
    if (formData.attributes_metadata.some(attr => !attr.name || !attr.type)) {
      setError('All attributes must have a name and type.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/sensors', formData);
      setSuccess(response.data.message);
      setFormData({
        identifier: '',
        name: '',
        active: true,
        access_token: '',
        attributes_metadata: [{ name: '', type: 'number', unit: '' }],
        description: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating sensor.');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Criar Sensor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 items-center">
            <Label htmlFor="identifier" className="text-right font-medium">Identificador</Label>
            <Input
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder="e.g., teste5555555"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 items-center">
            <Label htmlFor="name" className="text-right font-medium">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Sensor Teste 555"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 items-center">
            <Label htmlFor="active" className="text-right font-medium">Ativo</Label>
            <Select
              name="active"
              value={formData.active.toString()}
              onValueChange={(value) => handleSelectChange('active', value === 'true')}
              className="col-span-2"
            >
              <SelectTrigger id="active">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 items-center">
            <Label htmlFor="access_token" className="text-right font-medium">Token de Acesso</Label>
            <Input
              id="access_token"
              name="access_token"
              value={formData.access_token}
              onChange={handleInputChange}
              placeholder="e.g., 321"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 items-center">
            <Label htmlFor="description" className="text-right font-medium">Descrição</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Sensor de pressão ambiente"
              className="col-span-2"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-right font-medium">Atributos</Label>
            {formData.attributes_metadata.map((attr, index) => (
              <div key={index} className="grid grid-cols-4 gap-x-4 gap-y-4 items-center">
                <Input
                  placeholder="Nome (e.g., pressure)"
                  value={attr.name}
                  onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                />
                <Select
                  value={attr.type}
                  onValueChange={(value) => handleAttributeChange(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Booleano</SelectItem>
                    <SelectItem value="string">Texto</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Unidade (e.g., hPa)"
                  value={attr.unit}
                  onChange={(e) => handleAttributeChange(index, 'unit', e.target.value)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeAttribute(index)}
                  disabled={formData.attributes_metadata.length === 1}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addAttribute} className="mt-2">
              Adicionar Atributo
            </Button>
          </div>
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
          <div className="flex justify-end">
            <Button type="submit">Criar Sensor</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SensorForm;