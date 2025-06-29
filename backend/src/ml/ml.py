from sklearn.ensemble import IsolationForest
import numpy as np
from models.database import get_readings
def process_data():
    return {}

def train_model():
    readings = get_readings()
    if not readings:
        
        return {
            'temperature': IsolationForest(contamination=0.1).fit(np.array([[22.0]])),
            'humidity': IsolationForest(contamination=0.1).fit(np.array([[50.0]]))
        }
    
    attributes_data = {}
    for reading in readings:
        for attr_name, attr_value in reading[2].items():  
            if attr_name not in attributes_data:
                attributes_data[attr_name] = []
            attributes_data[attr_name].append([attr_value])
    
    models = {}
    for attr_name, values in attributes_data.items():
        models[attr_name] = IsolationForest(contamination=0.1)
        models[attr_name].fit(np.array(values))
    
    return models

def detect_anomaly(attributes, models):
    anomalies = {}
    for attr_name, value in attributes.items():
        if attr_name in models:
            X = np.array([[value]])
            if models[attr_name].predict(X)[0] == -1:
                anomalies[attr_name] = value
    return anomalies if anomalies else None
# 