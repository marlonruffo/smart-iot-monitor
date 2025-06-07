from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from models.database import insert_reading, get_readings, insert_sensor, get_sensor
from ml.ml import detect_anomaly, train_model

app = Flask(__name__)
socketio = SocketIO(app)

model = train_model()

@app.route('/data', methods=['POST'])
def receive_data():
    data = request.json
    identifier = data.get('identifier')
    attributes = data.get('attributes')
    token = request.headers.get('Authorization')

    if not identifier or not attributes:
        return jsonify({'error': 'Missing identifier or attributes'}), 400

    sensor = get_sensor(identifier)
    if not sensor:
        return jsonify({'error': 'Sensor not found'}), 404
    if not sensor['active']:
        return jsonify({'error': 'Sensor is inactive'}), 403
    if token != sensor['access_token']:
        return jsonify({'error': 'Invalid access token'}), 401

    if not insert_reading(identifier, attributes):
        return jsonify({'error': 'Failed to insert reading'}), 500

    anomalies = detect_anomaly(attributes, model)
    if anomalies:
        socketio.emit('anomaly', {'identifier': identifier, 'anomalies': anomalies})
    
    return jsonify({'status': 'success'})

@app.route('/sensors', methods=['POST'])
def create_sensor():
    data = request.json
    required_fields = ['identifier', 'name', 'active', 'access_token', 'type', 'unit', 'frequency', 'address']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        sensor_id = insert_sensor(data)
        return jsonify({'status': 'success', 'sensor_id': sensor_id, 'identifier': data['identifier']}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to create sensor: {str(e)}'}), 500

@app.route('/train', methods=['POST'])
def retrain_model():
    global model
    model = train_model()
    return jsonify({'status': 'model retrained'})

@app.route('/sensors/<identifier>', methods=['GET'])
def get_sensor_data(identifier):
    sensor = get_sensor(identifier)
    if not sensor:
        return jsonify({'error': 'Sensor not found'}), 404
    
    readings = get_readings(identifier)
    sensor['readings'] = [
        {
            'id': reading[0],
            'sensor_id': reading[1],
            'attributes': reading[2],
            'timestamp': reading[3]
        } for reading in readings
    ]
    
    return jsonify(sensor)

if __name__ == '__main__':
    socketio.run(app, debug=True)