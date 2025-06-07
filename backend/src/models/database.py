import sqlite3

def init_db():
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings
                 (id INTEGER PRIMARY KEY, sensor_id INTEGER, temperature REAL, timestamp TEXT)''')
    conn.commit()
    conn.close()

def insert_reading(sensor_id, temperature):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    c.execute("INSERT INTO readings (sensor_id, temperature, timestamp) VALUES (?, ?, datetime('now'))",
              (sensor_id, temperature))
    conn.commit()
    conn.close()

def get_readings(sensor_id=None):
    conn = sqlite3.connect('iot.db')
    c = conn.cursor()
    if sensor_id:
        c.execute("SELECT * FROM readings WHERE sensor_id = ?", (sensor_id,))
    else:
        c.execute("SELECT * FROM readings")
    readings = c.fetchall()
    conn.close()
    return readings

init_db()