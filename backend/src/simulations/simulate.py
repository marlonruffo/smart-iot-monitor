import requests
import time
import random

def simulate_sensor_data(sensor_id):
    while True:
        temperature = random.uniform(20, 25)  #normal temperature
        if random.random() < 0.1:  
            temperature += random.uniform(10, 15)  # aomaly temperature
        data = {'sensor_id': sensor_id, 'temperature': temperature}
        try:
            requests.post('http://localhost:5000/data', json=data)
        except requests.exceptions.RequestException:
            print(f"Erro ao enviar dados do sensor {sensor_id}")
        time.sleep(5)  # simulate every 5s

if __name__ == '__main__':
    for i in range(1, 4):  
        import threading
        t = threading.Thread(target=simulate_sensor_data, args=(i,))
        t.start()