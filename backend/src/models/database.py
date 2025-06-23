import sqlite3
import json
import datetime

DATABASE = 'iot.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensors (
            identifier TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            active BOOLEAN NOT NULL,
            access_token TEXT NOT NULL,
            attributes_metadata TEXT NOT NULL,
            description TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id TEXT NOT NULL,
            attributes TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (sensor_id) REFERENCES sensors (identifier)
        )
    ''')
    conn.commit()
    conn.close()

def insert_sensor(sensor):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO sensors (identifier, name, active, access_token, attributes_metadata, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        sensor['identifier'],
        sensor['name'],
        sensor['active'],
        sensor['access_token'],
        json.dumps(sensor['attributes_metadata']),
        sensor.get('description')
    ))
    conn.commit()
    conn.close()

def get_all_sensors():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT identifier, name, active, access_token, attributes_metadata, description FROM sensors')
    rows = c.fetchall()
    conn.close()
    sensors = []
    for row in rows:
        sensor = {
            'identifier': row[0],
            'name': row[1],
            'active': bool(row[2]),
            'access_token': row[3],
            'attributes_metadata': json.loads(row[4]),
            'description': row[5]
        }
        sensors.append(sensor)
    return sensors

def get_sensor_by_identifier(identifier):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT identifier, name, active, access_token, attributes_metadata, description FROM sensors WHERE identifier = ?', (identifier,))
    row = c.fetchone()
    conn.close()
    if row:
        return {
            'identifier': row[0],
            'name': row[1],
            'active': bool(row[2]),
            'access_token': row[3],
            'attributes_metadata': json.loads(row[4]),
            'description': row[5]
        }
    return None

def insert_reading(sensor_id, attributes):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    timestamp = datetime.datetime.now().isoformat()
    c.execute('''
        INSERT INTO readings (sensor_id, attributes, timestamp)
        VALUES (?, ?, ?)
    ''', (sensor_id, json.dumps(attributes), timestamp))
    reading_id = c.lastrowid
    conn.commit()
    conn.close()
    return reading_id

def get_readings(sensor_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT id, sensor_id, attributes, timestamp FROM readings WHERE sensor_id = ? ORDER BY timestamp DESC', (sensor_id,))
    rows = c.fetchall()
    conn.close()
    readings = []
    for row in rows:
        reading = {
            'id': row[0],
            'sensor_id': row[1],
            'attributes': json.loads(row[2]),
            'timestamp': row[3]
        }
        readings.append(reading)
    return readings