import sqlite3
import json
from datetime import datetime

def init_db():
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    
    c.execute("PRAGMA table_info(readings)")
    columns = [info[1] for info in c.fetchall()]
    if 'temperature' in columns:
        
        c.execute("ALTER TABLE readings RENAME TO readings_old")
       
        c.execute('''CREATE TABLE readings
                     (id INTEGER PRIMARY KEY, sensor_id INTEGER, attributes TEXT, timestamp TEXT,
                      FOREIGN KEY(sensor_id) REFERENCES sensors(id))''')
        
        c.execute("INSERT INTO readings (id, sensor_id, attributes, timestamp) "
                  "SELECT id, sensor_id, json_object('temperature', temperature), timestamp "
                  "FROM readings_old")
        c.execute("DROP TABLE readings_old")
    elif not columns:
        
        c.execute('''CREATE TABLE readings
                     (id INTEGER PRIMARY KEY, sensor_id INTEGER, attributes TEXT, timestamp TEXT,
                      FOREIGN KEY(sensor_id) REFERENCES sensors(id))''')
    
    
    c.execute('''CREATE TABLE IF NOT EXISTS sensors
                 (id INTEGER PRIMARY KEY,
                  identifier TEXT NOT NULL UNIQUE,
                  name TEXT NOT NULL,
                  active BOOLEAN NOT NULL,
                  access_token TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  type TEXT NOT NULL,
                  unit TEXT NOT NULL,
                  frequency INTEGER NOT NULL,
                  address TEXT ,
                  last_reading TEXT,
                  description TEXT,
                  location_coordinates TEXT,
                  device_model TEXT,
                  manufacturer TEXT,
                  status_message TEXT,
                  battery_level REAL,
                  connection_type TEXT)''')
    conn.commit()
    conn.close()

def insert_sensor(sensor_data):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    current_time = datetime.now().isoformat()
    address_json = json.dumps(sensor_data['address'])
    try:
        c.execute('''INSERT INTO sensors (
                        identifier, name, active, access_token, created_at, updated_at, type, unit, frequency,
                        address, last_reading, description, location_coordinates, device_model,
                        manufacturer, status_message, battery_level, connection_type
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (
                      sensor_data['identifier'],
                      sensor_data['name'],
                      sensor_data['active'],
                      sensor_data['access_token'],
                      current_time,
                      current_time,
                      sensor_data['type'],
                      sensor_data['unit'],
                      sensor_data['frequency'],
                      address_json,
                      None,
                      sensor_data.get('description'),
                      json.dumps(sensor_data.get('location_coordinates', {})),
                      sensor_data.get('device_model'),
                      sensor_data.get('manufacturer'),
                      sensor_data.get('status_message'),
                      sensor_data.get('battery_level'),
                      sensor_data.get('connection_type')
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
            'unit': sensor[8],
            'frequency': sensor[9],
            'address': json.loads(sensor[10]),
            'last_reading': sensor[11],
            'description': sensor[12],
            'location_coordinates': json.loads(sensor[13]) if sensor[13] else {},
            'device_model': sensor[14],
            'manufacturer': sensor[15],
            'status_message': sensor[16],
            'battery_level': sensor[17],
            'connection_type': sensor[18]
        }
    return None

def insert_reading(identifier, attributes):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    
    sensor = get_sensor(identifier)
    if not sensor or not sensor['active']:
        conn.close()
        return False
    attributes_json = json.dumps(attributes)
    current_time = datetime.now().isoformat()
    c.execute("INSERT INTO readings (sensor_id, attributes, timestamp) VALUES (?, ?, ?)",
              (sensor['id'], attributes_json, current_time))
    
    c.execute("UPDATE sensors SET last_reading = ?, updated_at = ? WHERE identifier = ?",
              (current_time, current_time, identifier))
    conn.commit()
    conn.close()
    return True

def get_readings(identifier=None):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    if identifier:
        c.execute("SELECT r.* FROM readings r JOIN sensors s ON r.sensor_id = s.id WHERE s.identifier = ?", (identifier,))
    else:
        c.execute("SELECT * FROM readings")
    readings = c.fetchall()
    conn.close()
    processed_readings = []
    for r in readings:
        try:
            attributes = json.loads(r[2])
        except (TypeError, json.JSONDecodeError):
            attributes = {'temperature': float(r[2])}
        processed_readings.append((r[0], r[1], attributes, r[3]))
    return processed_readings

init_db()