from sklearn.ensemble import IsolationForest
import numpy as np
from models.database import get_readings

def train_model():
    readings = get_readings()
    if not readings:
        
        temperatures = np.array([[22.0]])
    else:
        temperatures = np.array([[reading[2]] for reading in readings])  
    model = IsolationForest(contamination=0.1)
    model.fit(temperatures)
    return model

def detect_anomaly(temperature, model):
    X = np.array([[temperature]])
    return model.predict(X)[0] == -1  