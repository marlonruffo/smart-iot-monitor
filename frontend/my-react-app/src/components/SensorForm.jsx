import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SensorForm() {
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    active: true,
    access_token: '',
    type: '',
    frequency: '',
    address: { cep: '', city: '', state: '', country: '' },
    attributes_metadata: [],
  });
  const [attributeInput, setAttributeInput] = useState({ name: '', type: 'number', unit: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAttributeChange = (e) => {
    const { name, value } = e.target;
    setAttributeInput({ ...attributeInput, [name]: value });
  };

  const addAttribute = () => {
    if (!attributeInput.name || !attributeInput.type) {
      setError('Nome e tipo do atributo são obrigatórios');
      return;
    }
    setFormData({
      ...formData,
      attributes_metadata: [
        ...formData.attributes_metadata,
        {
          name: attributeInput.name,
          type: attributeInput.type,
          unit: attributeInput.unit || undefined,
        },
      ],
    });
    setAttributeInput({ name: '', type: 'number', unit: '' });
    setError('');
  };

  const removeAttribute = (name) => {
    setFormData({
      ...formData,
      attributes_metadata: formData.attributes_metadata.filter(attr => attr.name !== name),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/sensors', {
        ...formData,
        active: formData.active === 'true' || formData.active === true,
        frequency: parseInt(formData.frequency),
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccess('Sensor criado com sucesso!');
      setError('');
      setFormData({
        identifier: '',
        name: '',
        active: true,
        access_token: '',
        type: '',
        frequency: '',
        address: { cep: '', city: '', state: '', country: '' },
        attributes_metadata: [],
      });
    } catch (err) {
      console.error('Error creating sensor:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao criar sensor';
      setError(`Erro: ${errorMessage}`);
      setSuccess('');
    }
  };

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle>Criar Sensor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="form space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Identificador</Label>
            <Input
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="active">Ativo</Label>
            <Select
              name="active"
              value={String(formData.active)}
              onValueChange={(value) => setFormData({ ...formData, active: value === 'true' })}
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
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência (segundos)</Label>
            <Input
              id="frequency"
              name="frequency"
              type="number"
              value={formData.frequency}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              name="address.cep"
              placeholder="CEP"
              value={formData.address.cep}
              onChange={handleChange}
            />
            <Input
              name="address.city"
              placeholder="Cidade"
              value={formData.address.city}
              onChange={handleChange}
            />
            <Input
              name="address.state"
              placeholder="Estado"
              value={formData.address.state}
              onChange={handleChange}
            />
            <Input
              name="address.country"
              placeholder="País"
              value={formData.address.country}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Atributos</Label>
            <div className="flex space-x-2">
              <Input
                name="name"
                placeholder="Nome do atributo"
                value={attributeInput.name}
                onChange={handleAttributeChange}
              />
              <Select
                name="type"
                value={attributeInput.type}
                onValueChange={(value) => setAttributeInput({ ...attributeInput, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="string">Texto</SelectItem>
                  <SelectItem value="boolean">Booleano</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="unit"
                placeholder="Unidade (opcional)"
                value={attributeInput.unit}
                onChange={handleAttributeChange}
              />
              <Button type="button" onClick={addAttribute}>Adicionar</Button>
            </div>
            {formData.attributes_metadata.length > 0 && (
              <ul className="mt-2">
                {formData.attributes_metadata.map(attr => (
                  <li key={attr.name} className="flex justify-between items-center">
                    <span>{attr.name} ({attr.type}{attr.unit ? `, ${attr.unit}` : ''})</span>
                    <Button variant="destructive" size="sm" onClick={() => removeAttribute(attr.name)}>Remover</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit">Criar Sensor</Button>
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
      </CardContent>
    </Card>
  );
}

export default SensorForm;