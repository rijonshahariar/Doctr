import pandas as pd
from sklearn.model_selection import train_test_split

# Load dataset
df = pd.read_csv('DiseaseAndSymptoms.csv')

# Strip whitespace
for col in df.select_dtypes(include=['object']).columns:
    df[col] = df[col].str.strip()

print(f"Total rows: {len(df)}")

# Separate features and label
X = df.drop('Disease', axis=1)
y = df['Disease']

print(f"Feature columns: {list(X.columns)}")
print(f"Sample diseases: {y.unique()}")

# Train-test split with shuffle and fixed random state
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

# Check for overlap between train and test (should be zero)
overlap = pd.merge(X_train, X_test, how='inner')
print(f"Overlap between train and test features: {len(overlap)}")

# Check for duplicates in entire dataset
duplicates = df.duplicated().sum()
print(f"Total duplicate rows in dataset: {duplicates}")

# OPTIONAL: If symptoms are categorical, encode them
X_train_enc = pd.get_dummies(X_train)
X_test_enc = pd.get_dummies(X_test)

# Align columns in train and test (very important!)
X_test_enc = X_test_enc.reindex(columns = X_train_enc.columns, fill_value=0)

# Encode labels
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
y_train_enc = le.fit_transform(y_train)
y_test_enc = le.transform(y_test)

# Now train a simple model and check accuracy
import xgboost as xgb
from sklearn.metrics import accuracy_score

model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
model.fit(X_train_enc, y_train_enc)
y_pred = model.predict(X_test_enc)

acc = accuracy_score(y_test_enc, y_pred)
print(f"Test accuracy: {acc:.4f}")
