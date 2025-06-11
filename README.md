# Medical Symptom Diagnosis Chatbot

A web-based chatbot that predicts diseases from user-input symptoms using explainable AI (SHAP). The system provides interpretable explanations for its predictions, helping users understand why certain diseases were predicted based on their symptoms.

## Features

- Symptom input via checkboxes or free text
- Disease prediction using decision tree classifier
- SHAP-based explanations for predictions
- Interactive chat interface
- User feedback collection
- Responsive design using Tailwind CSS

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

1. Clone this repository
2. Install the required dependencies:
```bash
pip install flask pandas numpy scikit-learn shap joblib matplotlib plotly
```

## Project Structure

- `app.py`: Flask backend with model training and API endpoints
- `index.html`: Frontend interface with chat functionality
- `DiseaseAndSymptoms.csv`: Dataset for symptom-disease mapping
- `symptom_Description.csv`: Symptom descriptions
- `decision_tree_model.pkl`: Trained model (generated on first run)

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## API Endpoints

- `/predict` (POST): Predict disease from symptoms
- `/feedback` (POST): Submit user feedback
- `/symptoms` (GET): Get list of all possible symptoms

## Dataset Information

The project uses the Disease Symptom Prediction dataset with approximately 4,000 symptom-disease pairs. The dataset is preprocessed to map binary symptom columns to disease targets.

## Disclaimer

This tool is not a substitute for professional medical advice. Always consult with healthcare professionals for medical decisions.

## Privacy

- No permanent storage of user inputs
- Feedback is logged anonymously
- No external API calls or data sharing

## Development

The project is built with:
- Backend: Python, Flask, scikit-learn, SHAP
- Frontend: HTML, Tailwind CSS, JavaScript
- Visualization: Matplotlib/Plotly for SHAP plots 