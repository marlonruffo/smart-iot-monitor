import sqlite3
import json
from datetime import datetime

def init_db():
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS sensors
                 (id INTEGER PRIMARY KEY,
                  identifier TEXT NOT NULL UNIQUE,
                  name TEXT NOT NULL,
                  active BOOLEAN NOT NULL,
                  access_token TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  type TEXT NOT NULL,
                  frequency INTEGER NOT NULL,
                  address TEXT,
                  last_reading TEXT,
                  description TEXT,
                  location_coordinates TEXT,
                  device_model TEXT,
                  manufacturer TEXT,
                  status_message TEXT,
                  battery_level REAL,
                  connection_type TEXT,
                  attributes_metadata TEXT NOT NULL)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS readings
                 (id INTEGER PRIMARY KEY,
                  identifier TEXT,
                  attributes TEXT,
                  timestamp TEXT,
                  FOREIGN KEY(identifier) REFERENCES sensors(identifier))''')
    
    conn.commit()
    conn.close()

def insert_sensor(sensor_data):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    current_time = datetime.now().isoformat()
    address_json = json.dumps(sensor_data['address'])
    attributes_metadata_json = json.dumps(sensor_data.get('attributes_metadata', []))
    try:
        c.execute('''INSERT INTO sensors (
                        identifier, name, active, access_token, created_at, updated_at, type, frequency,
                        address, last_reading, description, location_coordinates, device_model,
                        manufacturer, status_message, battery_level, connection_type, attributes_metadata
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (
                      sensor_data['identifier'],
                      sensor_data['name'],
                      sensor_data['active'],
                      sensor_data['access_token'],
                      current_time,
                      current_time,
                      sensor_data['type'],
                      sensor_data['frequency'],
                      address_json,
                      None,
                      sensor_data.get('description'),
                      json.dumps(sensor_data.get('location_coordinates', {})),
                      sensor_data.get('device_model'),
                      sensor_data.get('manufacturer'),
                      sensor_data.get('status_message'),
                      sensor_data.get('battery_level'),
                      sensor_data.get('connection_type'),
                      attributes_metadata_json
                  ))
        sensor_id = c.lastrowid
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError("Identifier already exists")
    conn.close()
    return sensor_id

def get_sensor(identifier):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    c.execute("SELECT * FROM sensors WHERE identifier = ?", (identifier,))
    sensor = c.fetchone()
    conn.close()
    if sensor:
        return {
            'id': sensor[0],
            'identifier': sensor[1],
            'name': sensor[2],
            'active': bool(sensor[3]),
            'access_token': sensor[4],
            'created_at': sensor[5],
            'updated_at': sensor[6],
            'type': sensor[7],
            'frequency': sensor[8],
            'address': json.loads(sensor[9]) if sensor[9] else None,
            'last_reading': sensor[10],
            'description': sensor[11],
            'location_coordinates': json.loads(sensor[12]) if sensor[12] else {},
            'device_model': sensor[13],
            'manufacturer': sensor[14],
            'status_message': sensor[15],
            'battery_level': sensor[16],
            'connection_type': sensor[17],
            'attributes_metadata': json.loads(sensor[18]) if sensor[18] else []
        }
    return None

def get_sensors():
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    c.execute("SELECT identifier, name, attributes_metadata FROM sensors")
    sensors = [
        {
            'identifier': row[0],
            'name': row[1],
            'attributes_metadata': json.loads(row[2]) if row[2] else []
        } for row in c.fetchall()
    ]
    conn.close()
    return sensors

def insert_reading(identifier, attributes):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    
    sensor = get_sensor(identifier)
    if not sensor or not sensor['active']:
        conn.close()
        return False
    
    attributes_json = json.dumps(attributes)
    current_time = datetime.now().isoformat()
    
    c.execute("INSERT INTO readings (identifier, attributes, timestamp) VALUES (?, ?, ?)",
              (identifier, attributes_json, current_time))
    
    c.execute("UPDATE sensors SET last_reading = ?, updated_at = ? WHERE identifier = ?",
              (current_time, current_time, identifier))
    conn.commit()
    conn.close()
    return True

def get_readings(identifier=None):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    if identifier:
        c.execute("SELECT * FROM readings WHERE identifier = ?", (identifier,))
    else:
        c.execute("SELECT * FROM readings")
    readings = c.fetchall()
    conn.close()
    processed_readings = []
    for r in readings:
        try:
            attributes = json.loads(r[2])
        except (TypeError, json.JSONDecodeError):
            attributes = {}
        processed_readings.append((r[0], r[1], attributes, r[3]))
    return processed_readings

def get_readings_by_identifier(identifier):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    c.execute("SELECT id, identifier, attributes, timestamp FROM readings WHERE identifier = ?", (identifier,))
    readings = c.fetchall()
    conn.close()
    return [
        {
            'id': r[0],
            'identifier': r[1],
            'attributes': json.loads(r[2]) if r[2] else {},
            'timestamp': r[3]
        } for r in readings
    ]

init_db()