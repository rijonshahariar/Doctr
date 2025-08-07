import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def train_and_save_model():
    """Train the Logistic Regression model and save it to a file."""
    try:
        logger.debug("Loading datasets...")
        # Load the datasets
        df = pd.read_csv('DiseaseAndSymptoms.csv')
        cleaned_df = pd.read_csv('cleaned_data.csv')

        # Remove duplicates
        df = df.drop_duplicates(subset=df.columns, keep='first')
        cleaned_df = cleaned_df.drop_duplicates(subset=cleaned_df.columns, keep='first')

        logger.debug("Datasets loaded and cleaned.")

        # Prepare data for training
        X = cleaned_df.drop('disease', axis=1)
        y = cleaned_df['disease']

        # Split data for training and validation
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Initialize and train the model
        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(X_train, y_train)

        # Log model performance
        train_accuracy = accuracy_score(y_train, model.predict(X_train))
        test_accuracy = accuracy_score(y_test, model.predict(X_test))
        logger.debug(f"Model training complete. Train accuracy: {train_accuracy:.4f}, Test accuracy: {test_accuracy:.4f}")

        # Save the model
        joblib.dump(model, 'disease_predictor_model.joblib')
        logger.debug("Model saved to 'disease_predictor_model.joblib'.")

    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")

if __name__ == "__main__":
    train_and_save_model()
