import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import os
from django.conf import settings
from django.utils import timezone
from core.models import Location, ModelVersion, ModelPrediction, Dataset
import logging

logger = logging.getLogger(__name__)


class MigrationRiskModel:
    """ML model for predicting rural youth migration risk."""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.label_encoder = LabelEncoder()
        
    def prepare_features(self, location_id, year):
        """Prepare features for a location-year combination."""
        try:
            location = Location.objects.get(id=location_id)
            
            # Get data from various tables
            pop_data = location.population_data.filter(year=year).first()
            mig_data = location.migration_data.filter(year=year).first()
            emp_data = location.employment_data.filter(year=year).first()
            edu_data = location.education_data.filter(year=year).first()
            health_data = location.healthcare_data.filter(year=year).first()
            infra_data = location.infrastructure_data.filter(year=year).first()

            # Fallback to latest available records if no exact year match
            if not any([pop_data, mig_data, emp_data, edu_data, health_data, infra_data]):
                pop_data = location.population_data.order_by('-year').first()
                mig_data = location.migration_data.order_by('-year').first()
                emp_data = location.employment_data.order_by('-year').first()
                edu_data = location.education_data.order_by('-year').first()
                health_data = location.healthcare_data.order_by('-year').first()
                infra_data = location.infrastructure_data.order_by('-year').first()
            
            def get_val(obj, attr, default):
                if obj is None:
                    return default
                val = getattr(obj, attr, None)
                return default if val is None else float(val)

            def get_ratio(obj, num_attr, den_attr, default=0.2):
                if obj is None:
                    return default
                num = getattr(obj, num_attr, None)
                den = getattr(obj, den_attr, None)
                if num is None or den is None or float(den) == 0:
                    return default
                return float(num) / float(den)

            features = {
                'youth_percentage': get_val(pop_data, 'youth_percentage', 20.0),
                'population_density': get_val(pop_data, 'population_density', 250.0),
                'urban_population_ratio': get_ratio(pop_data, 'urban_population', 'total_population', 0.2),
                'migration_rate': get_val(mig_data, 'migration_rate', 5.0),
                'migration_intent_percentage': get_val(mig_data, 'migration_intent_percentage', 30.0),
                'unemployment_rate': get_val(emp_data, 'unemployment_rate', 15.0),
                'youth_unemployment_rate': get_val(emp_data, 'youth_unemployment_rate', 25.0),
                'poverty_rate': get_val(emp_data, 'poverty_rate', 50.0),
                'job_opportunities_index': get_val(emp_data, 'job_opportunities_index', 35.0),
                'literacy_rate': get_val(edu_data, 'literacy_rate', 70.0),
                'youth_literacy_rate': get_val(edu_data, 'youth_literacy_rate', 80.0),
                'school_enrollment_rate': get_val(edu_data, 'school_enrollment_rate', 80.0),
                'education_access_index': get_val(edu_data, 'education_access_index', 55.0),
                'healthcare_access_index': get_val(health_data, 'healthcare_access_index', 45.0),
                'distance_to_nearest_hospital': get_val(health_data, 'distance_to_nearest_hospital', 15.0),
                'electricity_coverage': get_val(infra_data, 'electricity_coverage', 25.0),
                'internet_coverage': get_val(infra_data, 'internet_coverage', 10.0),
                'water_access_rate': get_val(infra_data, 'water_access_rate', 65.0),
                'infrastructure_gap_index': get_val(infra_data, 'infrastructure_gap_index', 65.0),
                'road_density': get_val(infra_data, 'road_density', 0.3),
            }
            
            # Ensure no None values
            for key in features:
                if features[key] is None:
                    features[key] = 0.0
            
            return features
            
        except Exception as e:
            logger.error(f"Error preparing features for location {location_id}: {str(e)}")
            return None
    
    def load_training_data(self, year=2023):
        """Load training data for a specific year."""
        locations = Location.objects.filter(is_study_area=True)
        features_list = []
        labels = []
        
        for location in locations:
            features = self.prepare_features(location.id, year)
            if features:
                features_list.append(features)
                labels.append(0)  # Baseline label
        
        if not features_list:
            return None, None
        
        df = pd.DataFrame(features_list)
        self.feature_columns = df.columns.tolist()
        
        return df, np.array(labels)
    
    def train(self, year=2023, algorithm='random_forest', hyperparameters=None):
        """Train the model with specified algorithm."""
        if hyperparameters is None:
            hyperparameters = {}
        
        # Load training data for specified year
        df, labels = self.load_training_data(year=year)
        
        if df is None or len(df) == 0:
            raise ValueError(f"No training data available for year {year}. Please validate and process a dataset first.")
        
        # Scale features
        X = self.scaler.fit_transform(df)
        y = labels
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Select algorithm
        if algorithm == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=hyperparameters.get('n_estimators', 100),
                max_depth=hyperparameters.get('max_depth', 10),
                random_state=42
            )
        elif algorithm == 'logistic_regression':
            self.model = LogisticRegression(
                C=hyperparameters.get('C', 1.0),
                max_iter=1000,
                random_state=42
            )
        elif algorithm == 'decision_tree':
            self.model = DecisionTreeClassifier(
                max_depth=hyperparameters.get('max_depth', 10),
                random_state=42
            )
        elif algorithm == 'gradient_boosting':
            self.model = GradientBoostingClassifier(
                n_estimators=hyperparameters.get('n_estimators', 100),
                learning_rate=hyperparameters.get('learning_rate', 0.1),
                max_depth=hyperparameters.get('max_depth', 3),
                random_state=42
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, y_pred, average='weighted', zero_division=0),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_.tolist()))
        else:
            feature_importance = {}
        
        return metrics, feature_importance
    
    def predict(self, location_id, year):
        """Make prediction for a location."""
        features = self.prepare_features(location_id, year)
        
        if features is None:
            raise ValueError(f"Cannot prepare features for location {location_id}")
        
        # Ensure features are in correct order
        feature_values = [features[col] for col in self.feature_columns]
        X = self.scaler.transform([feature_values])
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X)[0]
        
        # Map probabilities to risk categories
        risk_categories = ['low', 'moderate', 'high', 'very_high']
        
        # For now, use simple threshold-based classification
        # In production, this should be based on model calibration
        if len(probabilities) >= 4:
            category_idx = np.argmax(probabilities)
            risk_category = risk_categories[category_idx]
            risk_score = probabilities[category_idx]
        else:
            # Fallback for binary classification
            risk_score = probabilities[1] if len(probabilities) > 1 else probabilities[0]
            if risk_score < 0.25:
                risk_category = 'low'
            elif risk_score < 0.5:
                risk_category = 'moderate'
            elif risk_score < 0.75:
                risk_category = 'high'
            else:
                risk_category = 'very_high'
        
        return {
            'risk_score': float(risk_score),
            'risk_category': risk_category,
            'probabilities': {
                'low': float(probabilities[0]) if len(probabilities) > 0 else 0,
                'moderate': float(probabilities[1]) if len(probabilities) > 1 else 0,
                'high': float(probabilities[2]) if len(probabilities) > 2 else 0,
                'very_high': float(probabilities[3]) if len(probabilities) > 3 else 0,
            },
            'feature_values': features
        }
    
    def save_model(self, filepath):
        """Save trained model to disk."""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load trained model from disk."""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        logger.info(f"Model loaded from {filepath}")


def train_model_for_dataset(dataset_id, algorithm='random_forest', user=None):
    """Train a model for a specific dataset."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
        
        # Generate unique model name and version
        algo_display = dict(ModelVersion.ALGORITHM_CHOICES).get(algorithm, algorithm)
        model_name = f"Migration Risk Model - {dataset.name} ({algo_display})"
        
        count = ModelVersion.objects.filter(training_dataset=dataset, algorithm=algorithm).count() + 1
        version_str = f"{dataset.year}.{count}"
        while ModelVersion.objects.filter(name=model_name, version=version_str).exists():
            count += 1
            version_str = f"{dataset.year}.{count}"

        # Create model version record
        model_version = ModelVersion.objects.create(
            name=model_name,
            version=version_str,
            algorithm=algorithm,
            training_dataset=dataset,
            trained_by=user,
            status='training'
        )
        
        # Train model
        ml_model = MigrationRiskModel()
        metrics, feature_importance = ml_model.train(year=dataset.year, algorithm=algorithm)
        
        # Update model version with results
        model_version.accuracy = metrics['accuracy']
        model_version.precision = metrics['precision']
        model_version.recall = metrics['recall']
        model_version.f1_score = metrics['f1_score']
        model_version.confusion_matrix = metrics['confusion_matrix']
        model_version.feature_importance = feature_importance
        model_version.status = 'evaluated'
        model_version.evaluation_date = timezone.now()
        model_version.save()
        
        # Save model file
        model_dir = settings.ML_MODEL_PATH
        os.makedirs(model_dir, exist_ok=True)
        model_filename = f"model_{model_version.id}_{model_version.version}.pkl"
        model_filepath = os.path.join(model_dir, model_filename)
        ml_model.save_model(model_filepath)
        
        model_version.model_file_path = model_filepath
        model_version.save()
        
        # Generate predictions for all study areas
        try:
            generate_predictions(model_version.id, dataset.year, user=user)
        except Exception as pred_err:
            logger.warning(f"Failed to generate automatic predictions: {pred_err}")
        
        return model_version
        
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        if 'model_version' in locals():
            model_version.status = 'error'
            model_version.notes = str(e)
            model_version.save()
        raise


def generate_predictions(model_version_id, year, user=None):
    """Generate predictions for all study areas using a trained model."""
    try:
        model_version = ModelVersion.objects.get(id=model_version_id)
        
        # Load model
        ml_model = MigrationRiskModel()
        ml_model.load_model(model_version.model_file_path)
        
        # Get all study locations
        locations = Location.objects.filter(is_study_area=True)
        
        predictions = []
        for location in locations:
            try:
                pred_data = ml_model.predict(location.id, year)
                
                prediction = ModelPrediction.objects.create(
                    location=location,
                    model_version=model_version,
                    dataset=model_version.training_dataset,
                    year=year,
                    risk_score=pred_data['risk_score'],
                    risk_category=pred_data['risk_category'],
                    probability_low=pred_data['probabilities']['low'],
                    probability_moderate=pred_data['probabilities']['moderate'],
                    probability_high=pred_data['probabilities']['high'],
                    probability_very_high=pred_data['probabilities']['very_high'],
                    feature_values=pred_data['feature_values']
                )
                predictions.append(prediction)
                
            except Exception as e:
                logger.error(f"Error generating prediction for {location.name}: {str(e)}")
                continue
        
        return predictions
        
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        raise
