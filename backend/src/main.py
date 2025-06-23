from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from models.database import init_db, insert_sensor, get_all_sensors, insert_reading, get_readings, get_sensor_by_identifier
import json
import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173")

init_db()

def check_condition(attr_value, condition, notif):
    try:
        if condition == "range" and isinstance(attr_value, (int, float)):
            return float(attr_value) >= float(notif['min']) and float(attr_value) <= float(notif['max'])
        elif condition == "greater_than":
            return float(attr_value) > float(notif['value'])
        elif condition == "less_than":
            return float(attr_value) < float(notif['value'])
        elif condition == "equal_to":
            if isinstance(attr_value, (bool)):
                return str(attr_value).lower() == str(notif['value']).lower()
            return float(attr_value) == float(notif['value'])
    except (ValueError, TypeError):
        return False
    return False

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

    sensor = get_sensor_by_identifier(identifier)
    if not sensor or sensor['access_token'] != auth_token:
        return jsonify({'error': 'Invalid sensor or token'}), 401

    try:
        for attr_name, attr_value in attributes.items():
            attr_meta = next((attr for attr in sensor['attributes_metadata'] if attr['name'] == attr_name), None)
            if attr_meta and 'notifications' in attr_meta:
                for notif in attr_meta['notifications']:
                    condition = notif.get('condition')
                    if condition != 'none':
                        if check_condition(attr_value, condition, notif):
                            alert_message = {
                                'sensor_id': identifier,
                                'attribute': attr_name,
                                'value': attr_value,
                                'condition': condition,
                                'threshold': notif.get('value', f"{notif.get('min', '')}-{notif.get('max', '')}"),
                                'alarm_type': notif.get('alarm_type'),
                                'message': notif.get('message'),
                                'timestamp': datetime.datetime.now().isoformat()
                            }
                            socketio.emit('alert', alert_message)

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