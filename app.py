import os
import json
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

# Global variables
disease_data = None
feature_names = None
disease_descriptions = None

def initialize_globals():
    """Initialize global variables by loading and preprocessing data."""
    global feature_names, disease_data, disease_descriptions
    
    try:
        logger.debug("Loading datasets...")
        # Load the main dataset
        df = pd.read_csv('DiseaseAndSymptoms.csv')
        
        # Load disease descriptions
        descriptions_df = pd.read_csv('Symptom_Description.csv')
        disease_descriptions = dict(zip(descriptions_df['Disease'], descriptions_df['Description']))
        logger.debug(f"Loaded {len(disease_descriptions)} disease descriptions")
        
        # Get all unique symptoms from all symptom columns
        all_symptoms = set()
        for col in df.columns:
            if col.startswith('Symptom_'):
                # Split each cell by comma and strip whitespace
                symptoms = df[col].dropna().apply(lambda x: [s.strip() for s in str(x).split(',') if s.strip()])
                all_symptoms.update([symptom for symptoms_list in symptoms for symptom in symptoms_list])
        
        # Convert to sorted list for consistent ordering
        feature_names = sorted(list(all_symptoms))
        logger.debug(f"Found {len(feature_names)} unique symptoms")
        
        # Process disease data
        disease_data = []
        for _, row in df.iterrows():
            disease = row['Disease']
            symptoms = set()
            for col in df.columns:
                if col.startswith('Symptom_'):
                    if pd.notna(row[col]):
                        symptoms.update([s.strip() for s in str(row[col]).split(',') if s.strip()])
            disease_data.append({
                'disease': disease,
                'symptoms': symptoms,
                'description': disease_descriptions.get(disease, 'No description available.')
            })
        
        logger.debug("Initialization complete")
        return True
        
    except Exception as e:
        logger.error(f"Error during initialization: {str(e)}")
        return False

def find_best_match(symptoms):
    """Find the best matching disease based on symptom overlap."""
    if not disease_data:
        raise ValueError("Disease data not initialized")
    
    # Convert input symptoms to set
    input_symptoms = set(symptoms)
    
    # Calculate match scores for each disease
    matches = []
    for disease_info in disease_data:
        disease_symptoms = disease_info['symptoms']
        
        # Calculate intersection and union of symptoms
        intersection = len(input_symptoms.intersection(disease_symptoms))
        union = len(input_symptoms.union(disease_symptoms))
        
        # Calculate Jaccard similarity (intersection over union)
        similarity = intersection / union if union > 0 else 0
        
        matches.append({
            'disease': disease_info['disease'],
            'similarity': similarity,
            'matching_symptoms': list(input_symptoms.intersection(disease_symptoms)),
            'missing_symptoms': list(disease_symptoms - input_symptoms),
            'description': disease_info['description']
        })
    
    # Sort by similarity score
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    return matches[0] if matches else None

@app.route('/')
def home():
    """Serve the main page."""
    return send_from_directory('static', 'index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Predict disease from symptoms."""
    try:
        if not disease_data:
            raise ValueError("Disease data not initialized")
            
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        
        # Find best matching disease
        match = find_best_match(symptoms)
        
        if not match:
            return jsonify({
                'error': 'No matching disease found'
            }), 404
        
        return jsonify({
            'disease': match['disease'],
            'probability': float(match['similarity']),
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
            
        # Return just the list of symptoms without descriptions
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