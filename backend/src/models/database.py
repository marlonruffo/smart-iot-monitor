import sqlite3
import json

def init_db():
    with sqlite3.connect('iot.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identifier TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                active BOOLEAN NOT NULL,
                access_token TEXT NOT NULL,
                attributes_metadata JSON NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identifier TEXT NOT NULL,
                attributes JSON NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def insert_sensor(sensor):
    with sqlite3.connect('iot.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sensors (
                identifier, name, active, access_token, attributes_metadata, description
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            sensor['identifier'],
            sensor['name'],
            sensor['active'],
            sensor['access_token'],
            json.dumps(sensor['attributes_metadata']),
            sensor.get('description')
        ))
        conn.commit()

def get_all_sensors():
    with sqlite3.connect('iot.db') as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sensors')
        sensors = cursor.fetchall()
        return [{
            'identifier': s['identifier'],
            'name': s['name'],
            'active': bool(s['active']),
            'access_token': s['access_token'],
            'attributes_metadata': json.loads(s['attributes_metadata']),
            'description': s['description'],
            'created_at': s['created_at'],
            'updated_at': s['updated_at']
        } for s in sensors]

def insert_reading(identifier, attributes):
    with sqlite3.connect('iot.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO readings (identifier, attributes, timestamp)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (identifier, json.dumps(attributes)))
        conn.commit()
        return cursor.lastrowid

def get_readings(identifier):
    with sqlite3.connect('iot.db') as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM readings WHERE identifier = ?', (identifier,))
        readings = cursor.fetchall()
        return [{
            'id': r['id'],
            'identifier': r['identifier'],
            'attributes': json.loads(r['attributes']),
            'timestamp': r['timestamp']
        } for r in readings]