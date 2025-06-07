from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from models.database import insert_reading, get_readings
from ml.ml import detect_anomaly, train_model

app = Flask(__name__)
socketio = SocketIO(app)

model = train_model()

@app.route('/data', methods=['POST'])
def receive_data():
    data = request.json
    sensor_id = data['sensor_id']
    temperature = data['temperature']
    
    #db
    insert_reading(sensor_id, temperature)

    if detect_anomaly(temperature, model):
        socketio.emit('anomaly', {'sensor_id': sensor_id, 'temperature': temperature})
    
    return jsonify({'status': 'success'})

@app.route('/train', methods=['POST'])
def retrain_model():
    global model
    model = train_model()
    return jsonify({'status': 'model retrained'})

@app.route('/sensors/<int:sensor_id>', methods=['GET'])
def get_sensor_data(sensor_id):
    readings = get_readings(sensor_id)
    if not readings:
        return jsonify({'error': 'Sensor not found or no readings available'}), 404
    sensor_data = [
        {
            'id': reading[0],
            'sensor_id': reading[1],
            'temperature': reading[2],
            'timestamp': reading[3]
        } for reading in readings
    ]
    return jsonify(sensor_data)

if __name__ == '__main__':
    socketio.run(app, debug=True)