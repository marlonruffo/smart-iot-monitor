from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from models.database import init_db, insert_sensor, get_all_sensors, insert_reading, get_readings
import json
import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
socketio = SocketIO(app, cors_allowed_origins="*")

init_db()

@app.route('/sensors', methods=['POST'])
def create_sensor():
    data = request.get_json()
    try:
        sensor = {
            'identifier': data['identifier'],
            'name': data['name'],
            'active': data['active'],
            'access_token': data['access_token'],
            'attributes_metadata': data['attributes_metadata'],
            'description': data.get('description')
        }
        insert_sensor(sensor)
        return jsonify({'message': 'Sensor created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/sensors', methods=['GET'])
def get_sensors():
    sensors = get_all_sensors()
    return jsonify(sensors), 200

@app.route('/data', methods=['POST'])
def submit_data():
    auth_token = request.headers.get('Authorization')
    if not auth_token:
        return jsonify({'error': 'Authorization token missing'}), 401

    data = request.get_json()
    identifier = data.get('identifier')
    attributes = data.get('attributes')

    sensors = get_all_sensors()
    sensor = next((s for s in sensors if s['identifier'] == identifier and s['access_token'] == auth_token), None)

    if not sensor:
        return jsonify({'error': 'Invalid sensor or token'}), 401

    try:
        reading_id = insert_reading(identifier, attributes)
        socketio.emit('new_reading', {
            'identifier': identifier,
            'attributes': attributes,
            'timestamp': datetime.datetime.now().isoformat()
        })
        return jsonify({'message': 'Data submitted successfully', 'reading_id': reading_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/readings/<identifier>', methods=['GET'])
def get_sensor_readings(identifier):
    readings = get_readings(identifier)
    return jsonify(readings), 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)