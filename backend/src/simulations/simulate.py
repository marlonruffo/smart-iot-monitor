import requests
import time
import random
from models.database import get_sensor

def simulate_sensor_data(identifier):
    sensor = get_sensor(identifier)
    if not sensor:
        print(f"Sensor {identifier} não encontrado.")
        return
    if not sensor['active']:
        print(f"Sensor {identifier} está inativo.")
        return
    
    token = sensor['access_token']
    frequency = sensor['frequency']  
    
    while True:
        attributes = {
            'temperature': random.uniform(20, 25), 
            'humidity': random.uniform(40, 60)    
        }
        if random.random() < 0.1:  
            attributes['temperature'] += random.uniform(10, 15)
        if random.random() < 0.1:
            attributes['humidity'] += random.uniform(20, 30)
        
        data = {'identifier': identifier, 'attributes': attributes}
        headers = {'Authorization': token}
        
        try:
            response = requests.post('http://localhost:5000/data', json=data, headers=headers)
            print(f"Sensor {identifier}: {response.json()}")
        except requests.exceptions.RequestException as e:
            print(f"Erro ao enviar dados do sensor {identifier}: {e}")
        
        time.sleep(frequency)

# Simular múltiplos sensores
if __name__ == '__main__':
    identifiers = ['SENSOR_001', 'SENSOR_002', 'SENSOR_003'] 
    for identifier in identifiers:
        import threading
        t = threading.Thread(target=simulate_sensor_data, args=(identifier,))
        t.start()
        # 