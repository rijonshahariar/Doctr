import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def train_and_save_model():
    """Train both Logistic Regression and Random Forest models and save them along with their accuracies."""
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

        # Train Logistic Regression model
        logreg_model = LogisticRegression(max_iter=1000, random_state=42)
        logreg_model.fit(X_train, y_train)
        logreg_train_acc = accuracy_score(y_train, logreg_model.predict(X_train))
        logreg_test_acc = accuracy_score(y_test, logreg_model.predict(X_test))
        logger.debug(f"Logistic Regression - Train accuracy: {logreg_train_acc:.4f}, Test accuracy: {logreg_test_acc:.4f}")

        # Train Random Forest model
        rf_model = RandomForestClassifier(random_state=42)
        rf_model.fit(X_train, y_train)
        rf_train_acc = accuracy_score(y_train, rf_model.predict(X_train))
        rf_test_acc = accuracy_score(y_test, rf_model.predict(X_test))
        logger.debug(f"Random Forest - Train accuracy: {rf_train_acc:.4f}, Test accuracy: {rf_test_acc:.4f}")

        # Save models
        joblib.dump(logreg_model, 'logreg_model.joblib')
        joblib.dump(rf_model, 'rf_model.joblib')

        # Save accuracies
        joblib.dump({
            'logreg': logreg_test_acc,
            'rf': rf_test_acc
        }, 'model_accuracies.joblib')
        logger.debug("Models and accuracies saved.")

    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")

if __name__ == "__main__":
    train_and_save_model()