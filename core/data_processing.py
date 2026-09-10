import pandas as pd
import numpy as np
from datetime import datetime
import os
from django.core.files.storage import default_storage
from django.conf import settings
from core.models import (
    Location, Dataset, PopulationData, MigrationData,
    EmploymentData, EducationData, HealthcareData, InfrastructureData
)
import logging

logger = logging.getLogger(__name__)


class DataValidator:
    """Validate uploaded data files."""
    
    REQUIRED_COLUMNS = {
        'population': ['district', 'sector', 'year', 'total_population'],
        'migration': ['district', 'sector', 'year', 'migration_rate'],
        'employment': ['district', 'sector', 'year', 'unemployment_rate'],
        'education': ['district', 'sector', 'year', 'literacy_rate'],
        'healthcare': ['district', 'sector', 'year', 'healthcare_access_index'],
        'infrastructure': ['district', 'sector', 'year', 'electricity_coverage'],
    }
    
    @staticmethod
    def validate_file(file_path, dataset_type):
        """Validate uploaded file structure and content."""
        errors = []
        warnings = []
        
        try:
            # Read file
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                return {'valid': False, 'errors': ['Unsupported file format']}
            
            # Check required columns
            required = DataValidator.REQUIRED_COLUMNS.get(dataset_type, [])
            missing_cols = [col for col in required if col not in df.columns]
            
            if missing_cols:
                errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            
            # Check for empty data
            if df.empty:
                errors.append("File contains no data")
            
            # Check year column
            if 'year' in df.columns:
                invalid_years = df[~df['year'].astype(str).str.match(r'^\d{4}$')]
                if not invalid_years.empty:
                    warnings.append(f"Some rows have invalid year format")
            
            # Check for duplicate location-year combinations
            if 'district' in df.columns and 'year' in df.columns:
                duplicates = df[df.duplicated(subset=['district', 'year'])]
                if not duplicates.empty:
                    warnings.append(f"Found {len(duplicates)} duplicate district-year combinations")
            
            # Check for missing values in key columns
            for col in required:
                if col in df.columns:
                    missing_count = df[col].isna().sum()
                    if missing_count > 0:
                        warnings.append(f"Column '{col}' has {missing_count} missing values")
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'row_count': len(df),
                'columns': df.columns.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return {'valid': False, 'errors': [str(e)]}


class DataProcessor:
    """Process and import data into the database."""
    
    @staticmethod
    def get_or_create_location(district, sector, province=None):
        """Get or create a location record."""
        try:
            # Try to find existing location
            location = Location.objects.get(
                district=district,
                sector=sector,
                location_type='sector'
            )
            return location
        except Location.DoesNotExist:
            # Create new location
            location = Location.objects.create(
                name=f"{district} - {sector}" if sector else district,
                location_type='sector' if sector else 'district',
                province=province or '',
                district=district,
                sector=sector or '',
                is_study_area=district in Location.STUDY_DISTRICTS
            )
            return location
    
    @staticmethod
    def process_population_data(file_path, dataset, year):
        """Process population data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                PopulationData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'total_population': row.get('total_population'),
                        'male_population': row.get('male_population'),
                        'female_population': row.get('female_population'),
                        'youth_population_15_24': row.get('youth_population_15_24'),
                        'youth_population_15_35': row.get('youth_population_15_35'),
                        'youth_percentage': row.get('youth_percentage'),
                        'household_count': row.get('household_count'),
                        'avg_household_size': row.get('avg_household_size'),
                        'population_density': row.get('population_density'),
                        'urban_population': row.get('urban_population'),
                        'rural_population': row.get('rural_population'),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing population row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}
    
    @staticmethod
    def process_migration_data(file_path, dataset, year):
        """Process migration data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                MigrationData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'migration_rate': row.get('migration_rate'),
                        'out_migration_count': row.get('out_migration_count'),
                        'in_migration_count': row.get('in_migration_count'),
                        'net_migration': row.get('net_migration'),
                        'youth_out_migration': row.get('youth_out_migration'),
                        'migration_intent_percentage': row.get('migration_intent_percentage'),
                        'primary_destination': row.get('primary_destination', ''),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing migration row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}
    
    @staticmethod
    def process_employment_data(file_path, dataset, year):
        """Process employment data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                EmploymentData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'total_labor_force': row.get('total_labor_force'),
                        'employed_population': row.get('employed_population'),
                        'unemployed_population': row.get('unemployed_population'),
                        'unemployment_rate': row.get('unemployment_rate'),
                        'youth_unemployment_rate': row.get('youth_unemployment_rate'),
                        'agricultural_employment': row.get('agricultural_employment'),
                        'formal_sector_employment': row.get('formal_sector_employment'),
                        'informal_sector_employment': row.get('informal_sector_employment'),
                        'avg_monthly_income': row.get('avg_monthly_income'),
                        'poverty_rate': row.get('poverty_rate'),
                        'business_count': row.get('business_count'),
                        'job_opportunities_index': row.get('job_opportunities_index'),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing employment row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}
    
    @staticmethod
    def process_education_data(file_path, dataset, year):
        """Process education data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                EducationData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'primary_schools': row.get('primary_schools'),
                        'secondary_schools': row.get('secondary_schools'),
                        'tertiary_institutions': row.get('tertiary_institutions'),
                        'literacy_rate': row.get('literacy_rate'),
                        'youth_literacy_rate': row.get('youth_literacy_rate'),
                        'school_enrollment_rate': row.get('school_enrollment_rate'),
                        'primary_enrollment': row.get('primary_enrollment'),
                        'secondary_enrollment': row.get('secondary_enrollment'),
                        'student_teacher_ratio': row.get('student_teacher_ratio'),
                        'education_access_index': row.get('education_access_index'),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing education row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}
    
    @staticmethod
    def process_healthcare_data(file_path, dataset, year):
        """Process healthcare data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                HealthcareData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'hospitals': row.get('hospitals'),
                        'health_centers': row.get('health_centers'),
                        'dispensaries': row.get('dispensaries'),
                        'doctors': row.get('doctors'),
                        'nurses': row.get('nurses'),
                        'hospital_beds': row.get('hospital_beds'),
                        'healthcare_access_index': row.get('healthcare_access_index'),
                        'distance_to_nearest_hospital': row.get('distance_to_nearest_hospital'),
                        'maternal_mortality_rate': row.get('maternal_mortality_rate'),
                        'infant_mortality_rate': row.get('infant_mortality_rate'),
                        'vaccination_coverage': row.get('vaccination_coverage'),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing healthcare row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}
    
    @staticmethod
    def process_infrastructure_data(file_path, dataset, year):
        """Process infrastructure data file."""
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        processed = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                location = DataProcessor.get_or_create_location(
                    row['district'],
                    row.get('sector', ''),
                    row.get('province')
                )
                
                InfrastructureData.objects.update_or_create(
                    location=location,
                    dataset=dataset,
                    year=year,
                    defaults={
                        'road_density': row.get('road_density'),
                        'paved_road_length': row.get('paved_road_length'),
                        'unpaved_road_length': row.get('unpaved_road_length'),
                        'electricity_coverage': row.get('electricity_coverage'),
                        'electricity_access_rate': row.get('electricity_access_rate'),
                        'internet_coverage': row.get('internet_coverage'),
                        'internet_access_rate': row.get('internet_access_rate'),
                        'mobile_network_coverage': row.get('mobile_network_coverage'),
                        'water_access_rate': row.get('water_access_rate'),
                        'sanitation_coverage': row.get('sanitation_coverage'),
                        'public_transport_access': row.get('public_transport_access'),
                        'infrastructure_gap_index': row.get('infrastructure_gap_index'),
                    }
                )
                processed += 1
                
            except Exception as e:
                errors.append(f"Row error: {str(e)}")
                logger.error(f"Error processing infrastructure row: {str(e)}")
        
        return {'processed': processed, 'errors': errors}


def process_dataset(dataset_id):
    """Process a dataset based on its type."""
    try:
        dataset = Dataset.objects.get(id=dataset_id)
        
        # Validate file first
        validation_result = DataValidator.validate_file(
            dataset.file_path,
            dataset.dataset_type
        )
        
        if not validation_result['valid']:
            dataset.status = 'error'
            dataset.validation_errors = '\n'.join(validation_result['errors'])
            dataset.save()
            return validation_result
        
        # Update dataset with validation info
        dataset.row_count = validation_result['row_count']
        dataset.status = 'validated'
        dataset.save()
        
        # Process based on type
        year = dataset.year
        processor_map = {
            'population': DataProcessor.process_population_data,
            'migration': DataProcessor.process_migration_data,
            'employment': DataProcessor.process_employment_data,
            'education': DataProcessor.process_education_data,
            'healthcare': DataProcessor.process_healthcare_data,
            'infrastructure': DataProcessor.process_infrastructure_data,
        }
        
        processor = processor_map.get(dataset.dataset_type)
        if processor:
            result = processor(dataset.file_path, dataset, year)
            
            dataset.status = 'processed'
            dataset.processed_date = datetime.now()
            dataset.processing_log = f"Processed {result['processed']} records"
            if result['errors']:
                dataset.processing_log += f"\nErrors: {len(result['errors'])}"
            
            dataset.save()
            
            return {
                'success': True,
                'processed': result['processed'],
                'errors': result['errors']
            }
        else:
            return {'success': False, 'error': 'Unsupported dataset type'}
            
    except Exception as e:
        logger.error(f"Error processing dataset: {str(e)}")
        dataset.status = 'error'
        dataset.validation_errors = str(e)
        dataset.save()
        return {'success': False, 'error': str(e)}
