import logging
from flask import Flask, request, jsonify, make_response
from flask_socketio import SocketIO
from flask_cors import CORS
from models.database import init_db, insert_sensor, get_all_sensors, insert_reading, get_readings, get_sensor_by_identifier, get_notifications, insert_notification
import json
import datetime
import csv
from io import StringIO
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, resources={r"/readings/*": {"origins": "http://localhost:5173"}, r"/*": {"origins": "http://localhost:5173"}})
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
                            insert_notification(
                                identifier, attr_name, attr_value, condition,
                                notif.get('value', f"{notif.get('min', '')}-{notif.get('max', '')}"), notif.get('alarm_type'), notif.get('message')
                            )
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

@app.route('/readings/csv/<identifier>', methods=['GET'])
def export_readings_csv(identifier):
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    
    sensor = get_sensor_by_identifier(identifier)
    if not sensor:
        return jsonify({"error": "Sensor not found"}), 404
    
    try:
        logging.debug(f"Exporting CSV for {identifier} with start_time={start_time}, end_time={end_time}")
        readings = get_readings(identifier, start_time, end_time)
        logging.debug(f"Raw readings for {identifier}: {readings}")
        
        if not readings or not isinstance(readings, (list, tuple)):
            raise ValueError("Readings data is empty or not a list/tuple")
        
        si = StringIO()
        writer = csv.writer(si)

        headers = ['timestamp'] + [attr['name'] for attr in sensor['attributes_metadata']]
        writer.writerow(headers)
        
        for reading in readings:
            if not isinstance(reading, dict):
                raise ValueError(f"Reading entry is not a dict: {reading}")
            timestamp = reading.get('timestamp', '')
            attributes = reading.get('attributes', {})
            if not isinstance(attributes, dict):
                raise ValueError(f"Attributes is not a dict: {attributes}")
            row = [timestamp]
            for attr in sensor['attributes_metadata']:
                value = attributes.get(attr['name'], '')
                row.append(value)
            writer.writerow(row)
        
        output = si.getvalue()
        si.close()
        
        response = make_response(output)
        response.headers['Content-Disposition'] = f'attachment; filename={identifier}_readings.csv'
        response.headers['Content-type'] = 'text/csv'
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        return response
    except ValueError as ve:
        logging.error(f"Validation error in CSV generation for {identifier}: {str(ve)}")
        return jsonify({"error": "Invalid data format in readings"}), 500
    except Exception as e:
        logging.error(f"Error generating CSV for {identifier}: {str(e)}")
        return jsonify({"error": "Internal server error while generating CSV"}), 500

@app.route('/notifications/<sensor_id>', methods=['GET'])
def get_sensor_notifications(sensor_id):
    notifications = get_notifications(sensor_id)
    return jsonify(notifications), 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)