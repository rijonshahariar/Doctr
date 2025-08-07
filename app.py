import os
import json
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import logging
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

# Global variables
disease_data = None
feature_names = None
disease_descriptions = None
model = None
disease_label_map = None
model_file = 'disease_predictor_model.joblib'

def initialize_globals():
    """Initialize global variables by loading data and the pre-trained model."""
    global feature_names, disease_data, disease_descriptions, model, disease_label_map

    try:
        logger.debug("Loading datasets...")
        # Load the datasets
        df = pd.read_csv('DiseaseAndSymptoms.csv')
        cleaned_df = pd.read_csv('cleaned_data.csv')

        # Remove duplicates
        df = df.drop_duplicates(subset=df.columns, keep='first')
        cleaned_df = cleaned_df.drop_duplicates(subset=cleaned_df.columns, keep='first')

        logger.debug("Datasets loaded and cleaned.")

        # Load disease descriptions
        descriptions_df = pd.read_csv('Symptom_Description.csv')
        disease_descriptions = dict(zip(descriptions_df['Disease'], descriptions_df['Description']))
        logger.debug(f"Loaded {len(disease_descriptions)} disease descriptions.")

        # Get all unique symptoms from cleaned dataset (excluding disease column)
        feature_names = [col for col in cleaned_df.columns if col != 'disease']
        logger.debug(f"Found {len(feature_names)} unique symptoms.")

        # Create disease label mapping
        unique_diseases = df['Disease'].unique()
        unique_numeric_labels = cleaned_df['disease'].unique()

        try:
            label_map_df = pd.read_csv('disease_label_map.csv')
            disease_label_map = dict(zip(label_map_df['numeric_label'], label_map_df['disease_name']))
            logger.debug("Loaded explicit disease label map from 'disease_label_map.csv'.")
        except FileNotFoundError:
            if len(unique_numeric_labels) <= len(unique_diseases):
                disease_label_map = dict(zip(unique_numeric_labels, unique_diseases))
            else:
                logger.error("Mismatch between numeric labels and disease names.")
                raise ValueError("Mismatch between numeric labels and disease names.")

        logger.debug(f"Created disease label map: {disease_label_map}.")

        # Process disease data for compatibility with existing logic
        disease_data = []
        for _, row in df.iterrows():
            disease = row['Disease']
            symptoms = set()
            for col in df.columns:
                if col.startswith('Symptom_') and pd.notna(row[col]):
                    symptoms.update([s.strip() for s in str(row[col]).split(',') if s.strip()])
            disease_data.append({
                'disease': disease,
                'symptoms': symptoms,
                'description': disease_descriptions.get(disease, 'No description available.')
            })

        logger.debug(f"Loaded {len(disease_data)} unique disease entries.")

        # Load the pre-trained model
        model = joblib.load('disease_predictor_model.joblib')
        logger.debug("Pre-trained model loaded successfully.")

        logger.debug("Initialization complete.")
        return True

    except Exception as e:
        logger.error(f"Error during initialization: {str(e)}")
        return False

def find_best_match(symptoms):
    """Predict disease using the trained model."""
    if not disease_data or not model or not disease_label_map:
        raise ValueError("Disease data, model, or label map not initialized")
    
    try:
        # Create a binary vector for input symptoms
        input_vector = np.zeros(len(feature_names))
        for symptom in symptoms:
            if symptom in feature_names:
                input_vector[feature_names.index(symptom)] = 1
            else:
                logger.warning(f"Symptom '{symptom}' not found in feature_names")
        
        # Predict disease and probabilities
        predicted_disease_idx = model.predict([input_vector])[0]
        probabilities = model.predict_proba([input_vector])[0]
        
        # Map numeric label to disease name
        if predicted_disease_idx not in disease_label_map:
            logger.error(f"Predicted disease index {predicted_disease_idx} not in disease_label_map")
            raise ValueError(f"Predicted disease index {predicted_disease_idx} not found in label map")
        
        predicted_disease = disease_label_map[predicted_disease_idx]
        logger.debug(f"Predicted disease index: {predicted_disease_idx}, Mapped to: {predicted_disease}")
        
        # Find the disease info
        disease_info = next((d for d in disease_data if d['disease'] == predicted_disease), None)
        if not disease_info:
            logger.error(f"Disease '{predicted_disease}' not found in disease_data")
            raise ValueError(f"Predicted disease '{predicted_disease}' not found in disease data")
        
        # Calculate matching and missing symptoms
        matching_symptoms = list(set(symptoms).intersection(disease_info['symptoms']))
        missing_symptoms = list(disease_info['symptoms'] - set(symptoms))
        
        return {
            'disease': predicted_disease,
            'probability': float(probabilities[model.classes_.tolist().index(predicted_disease_idx)]),
            'matching_symptoms': matching_symptoms,
            'missing_symptoms': missing_symptoms,
            'description': disease_info['description']
        }
    
    except Exception as e:
        logger.error(f"Error in find_best_match: {str(e)}")
        raise

@app.route('/')
def home():
    """Serve the main page."""
    return send_from_directory('static', 'index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Predict disease from symptoms using the trained model."""
    try:
        if not disease_data or not model or not disease_label_map:
            raise ValueError("Disease data, model, or label map not initialized")
            
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Find best matching disease
        match = find_best_match(symptoms)
        
        if not match:
            return jsonify({
                'error': 'No matching disease found'
            }), 404
        
        return jsonify({
            'disease': match['disease'],
            'probability': match['probability'],
            'matching_symptoms': match['matching_symptoms'],
            'missing_symptoms': match['missing_symptoms'],
            'description': match['description']
        })
    
    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/feedback', methods=['POST'])
def feedback():
    """Log user feedback."""
    try:
        data = request.get_json()
        rating = data.get('rating')
        
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Invalid rating'}), 400
        
        # Log feedback with timestamp
        with open('feedback.log', 'a') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f'{timestamp}, {rating}\n')
        
        return jsonify({'message': 'Feedback recorded'})
    
    except Exception as e:
        logger.error(f"Error in feedback endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Return list of all possible symptoms."""
    try:
        if feature_names is None:
            logger.error("Feature names not initialized")
            raise ValueError("Feature names not initialized")
            
        symptoms = {symptom: "" for symptom in feature_names}
        
        logger.debug(f"Returning {len(symptoms)} symptoms")
        return jsonify(symptoms)
    
    except Exception as e:
        logger.error(f"Error in symptoms endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Initialize global variables
    if not initialize_globals():
        logger.error("Failed to initialize application")
        exit(1)
    app.run(debug=True)