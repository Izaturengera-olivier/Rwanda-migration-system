# Rwanda Rural Youth Migration Risk Mapping System

A comprehensive web-based predictive mapping and decision-support platform for analyzing rural youth migration risk and infrastructure gaps in Rwanda.

## Overview

This system combines socioeconomic, demographic, infrastructure, and geographical data to apply Machine Learning for estimating migration-risk levels and uses GIS to display results geographically. It's designed for policymakers, district/sector authorities, development organizations, and researchers.

## Study Areas

The system focuses on Gisagara rural district in Rwanda:
- **Southern Province**: Gisagara District and its 13 administrative sectors (Gikonko, Gishubi, Kansi, Kibirizi, Kigembe, Mamba, Muganza, Mugombwa, Mukindo, Musha, Ndora, Nyanza, Save)

## Features

### User-Facing Features
- **Interactive Dashboard**: Overview with risk summary cards, statistics, and quick actions
- **Migration Risk Map**: Interactive GIS map showing risk levels by district/sector
- **District Profiles**: Detailed profiles with migration risk, infrastructure indicators, and contributing factors
- **Infrastructure Gaps**: Visualization of infrastructure coverage and gaps
- **Compare Areas**: Compare multiple districts/sectors across indicators
- **Historical Trends**: View risk and indicator changes over time
- **Report Generation**: Export summary reports as PDF

### Admin Features
- **Data Upload**: Upload and validate CSV/Excel datasets
- **Data Processing**: Clean, validate, and integrate datasets
- **Model Training**: Train and evaluate ML models
- **Model Management**: Version, evaluate, and activate models
- **Audit Logs**: Track all system actions

## Technology Stack

### Backend
- **Framework**: Django 5.0.6
- **API**: Django REST Framework
- **Database**: PostgreSQL with PostGIS
- **ML/Data**: Pandas, NumPy, Scikit-learn, GeoPandas
- **GIS**: GeoDjango, GDAL

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Maps**: Leaflet.js, React-Leaflet
- **Charts**: Chart.js, React-ChartJS-2
- **PDF Generation**: jsPDF

## Project Structure

```
Divine/
├── config/                 # Django project configuration
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                   # Core models and data processing
│   ├── models.py          # Database models
│   ├── admin.py           # Django admin configuration
│   └── data_processing.py # Data validation and processing
├── api/                    # REST API endpoints
│   ├── views.py           # API viewsets
│   ├── serializers.py     # Data serializers
│   └── urls.py            # API URL routing
├── ml_service/             # Machine learning service
│   └── models.py          # ML model training and prediction
├── gis_service/            # GIS processing utilities
│   └── utils.py           # GeoJSON and spatial operations
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── static/                 # Static files
├── media/                  # Uploaded files
├── ml_models/             # Saved ML models
├── logs/                  # Application logs
├── manage.py
├── requirements.txt
└── README.md
```

## Installation

### Prerequisites

- Python 3.8+
- PostgreSQL 12+ with PostGIS extension
- Node.js 16+ and npm
- GDAL library

### Backend Setup

1. **Clone the repository**
   ```bash
   cd Divine
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Linux/Mac
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DB_NAME=rwanda_migration
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=5432
   ```

5. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE rwanda_migration;
   CREATE EXTENSION postgis;
   ```

6. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start Django server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Database Schema

### Core Tables

- **users**: Custom user model with role-based access
- **locations**: Geographic locations (provinces, districts, sectors)
- **datasets**: Dataset metadata and versioning
- **population_data**: Population and demographic indicators
- **migration_data**: Migration-related indicators
- **employment_data**: Employment and economic indicators
- **education_data**: Education access indicators
- **healthcare_data**: Healthcare facilities and access
- **infrastructure_data**: Infrastructure indicators
- **model_versions**: ML model versioning
- **model_predictions**: Migration risk predictions
- **audit_logs**: System audit trail

## API Endpoints

### Locations
- `GET /api/locations/` - List all locations
- `GET /api/locations/study-districts/` - Get study districts
- `GET /api/locations/geojson/` - Get GeoJSON for maps
- `GET /api/locations/{id}/profile/` - Get location profile

### Datasets
- `GET /api/datasets/` - List datasets
- `POST /api/datasets/` - Upload dataset
- `POST /api/datasets/{id}/process/` - Process dataset

### Predictions
- `GET /api/predictions/` - List predictions
- `GET /api/predictions/by-district/` - Get district predictions
- `GET /api/predictions/risk-distribution/` - Risk category distribution

### Models
- `GET /api/models/` - List model versions
- `GET /api/models/active/` - Get active model
- `POST /api/models/train/` - Train new model
- `POST /api/models/{id}/activate/` - Activate model

### Dashboard
- `GET /api/dashboard/` - Dashboard statistics
- `GET /api/dashboard/compare/` - Compare areas
- `GET /api/dashboard/trends/` - Historical trends

## Data Requirements

### Required Data Fields

**Population Data**
- district, sector, year
- total_population, youth_population_15_24, youth_percentage
- population_density, urban_population, rural_population

**Migration Data**
- district, sector, year
- migration_rate, out_migration_count, migration_intent_percentage

**Employment Data**
- district, sector, year
- unemployment_rate, youth_unemployment_rate, poverty_rate
- job_opportunities_index

**Education Data**
- district, sector, year
- literacy_rate, youth_literacy_rate, school_enrollment_rate
- education_access_index

**Healthcare Data**
- district, sector, year
- healthcare_access_index, hospitals, health_centers
- distance_to_nearest_hospital

**Infrastructure Data**
- district, sector, year
- electricity_coverage, internet_coverage, water_access_rate
- road_density, infrastructure_gap_index

## ML Model Training

The system supports multiple algorithms:
- Logistic Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- Support Vector Machine

### Training Process

1. Upload and validate datasets
2. Process data into the database
3. Train model using selected algorithm
4. Evaluate model performance
5. Activate model for predictions

### Risk Categories

- **Low Risk**: Lower predicted migration risk
- **Moderate Risk**: Intermediate predicted risk
- **High Risk**: Higher predicted risk (priority for investigation)
- **Very High Risk**: Highest predicted risk category

## GIS Data

### Administrative Boundaries

The system requires GeoJSON files for:
- District boundaries
- Sector boundaries (optional, for more granular analysis)

### Importing Boundaries

Use the GIS service utilities to import GeoJSON files:
```python
from gis_service.utils import import_geojson_boundary

result = import_geojson_boundary(
    file_path='path/to/boundaries.geojson',
    location_type='district',
    province='Southern'
)
```

## Deployment

### Production Considerations

1. **Security**
   - Set `DEBUG=False`
   - Use strong `SECRET_KEY`
   - Configure `ALLOWED_HOSTS`
   - Enable HTTPS

2. **Database**
   - Use production PostgreSQL instance
   - Enable connection pooling
   - Set up regular backups

3. **Static Files**
   - Serve static files via CDN or nginx
   - Collect static files: `python manage.py collectstatic`

4. **Performance”
   - Enable caching
   - Use Gunicorn or uWSGI
   - Configure database indexes

5. **Monitoring**
   - Set up logging
   - Monitor system health
   - Track API performance

## User Guide

### For Normal Users

1. **View Dashboard**: Open the website to see overview statistics
2. **Explore Map**: Use the interactive map to view risk levels
3. **View Profiles**: Click on districts to see detailed profiles
4. **Compare Areas**: Use the compare feature to analyze multiple areas
5. **Generate Reports**: Export PDF reports for planning

### For Administrators

1. **Upload Data**: Use admin dashboard to upload new datasets
2. **Validate Data**: Review validation results and fix errors
3. **Process Data**: Process validated datasets into the database
4. **Train Models**: Train new ML models with updated data
5. **Activate Models**: Review model performance and activate
6. **Monitor Logs**: Review audit logs for system activity

## Troubleshooting

### Common Issues

**GDAL Library Not Found**
- Install GDAL: `conda install -c conda-forge gdal` or use system package manager
- Set `GDAL_LIBRARY_PATH` in `.env`

**PostGIS Extension Not Available**
- Ensure PostgreSQL has PostGIS installed
- Run: `CREATE EXTENSION postgis;` in your database

**Frontend API Connection Errors**
- Ensure Django server is running on port 8000
- Check CORS settings in Django settings
- Verify API_BASE in React components

**Model Training Fails**
- Ensure all required data is processed
- Check for missing values in training data
- Verify feature columns match model expectations

## License

This project is developed for academic and research purposes.

## Contact

For questions or support, please contact the development team.

## Acknowledgments

- National Institute of Statistics of Rwanda (NISR)
- Ministry of Infrastructure (MININFRA)
- Other data sources and contributors
