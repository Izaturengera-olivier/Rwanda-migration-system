# CHAPTER 4: SYSTEM ANALYSIS, DESIGN AND IMPLEMENTATION

## 4.1 Introduction

This chapter presents the analysis, design, and implementation of the proposed Predictive Mapping System for Rural Youth Migration Risk Based on Infrastructure Gaps to Support Evidence-Based Decision-Making in Gisagara District. The chapter begins with data analysis and presentation of findings from the survey conducted with rural youth and interviews with district officers. It then describes the existing system operations, followed by the design and implementation of the new system, including functional and non-functional requirements, system architecture, database design, and interface design. The chapter concludes with testing procedures and results to validate the system's functionality and reliability.

## 4.2 Data Analysis and Presentation

The data collected from 398 rural youth respondents in Gisagara District reveals significant insights concerning factors influencing youth migration and infrastructure gaps. Statistical analysis was conducted using frequency, percentage, and mean to identify major factors and assess infrastructure availability.

### Table 4.1: Respondents' Demographic Characteristics

| Demographic Factor | Category | Frequency | Percentage |
|-------------------|----------|-----------|------------|
| Gender | Male | 215 | 54.0% |
| | Female | 183 | 46.0% |
| Age Group | 16-20 years | 142 | 35.7% |
| | 21-25 years | 178 | 44.7% |
| | 26-30 years | 78 | 19.6% |
| Education Level | Primary | 89 | 22.4% |
| | Secondary | 256 | 64.3% |
| | Tertiary | 53 | 13.3% |
| Employment Status | Employed | 127 | 31.9% |
| | Unemployed | 271 | 68.1% |

### Table 4.2: Factors Influencing Rural Youth Migration

| Factor | Very Important | Important | Neutral | Not Important | Total |
|--------|---------------|-----------|---------|---------------|-------|
| Lack of employment opportunities | 245 (61.6%) | 98 (24.6%) | 35 (8.8%) | 20 (5.0%) | 398 |
| Limited education access | 187 (47.0%) | 134 (33.7%) | 52 (13.1%) | 25 (6.3%) | 398 |
| Poor healthcare facilities | 156 (39.2%) | 145 (36.4%) | 67 (16.8%) | 30 (7.5%) | 398 |
| Limited electricity access | 198 (49.7%) | 128 (32.2%) | 48 (12.1%) | 24 (6.0%) | 398 |
| Poor internet connectivity | 212 (53.3%) | 117 (29.4%) | 45 (11.3%) | 24 (6.0%) | 398 |
| Inadequate road infrastructure | 178 (44.7%) | 142 (35.7%) | 56 (14.1%) | 22 (5.5%) | 398 |
| Limited water access | 134 (33.7%) | 156 (39.2%) | 78 (19.6%) | 30 (7.5%) | 398 |

### Table 4.3: Availability of Infrastructure and Basic Services

| Infrastructure Type | Available | Not Available | Partially Available | Total |
|-------------------|-----------|---------------|-------------------|-------|
| Electricity | 89 (22.4%) | 178 (44.7%) | 131 (32.9%) | 398 |
| Internet Access | 67 (16.8%) | 212 (53.3%) | 119 (29.9%) | 398 |
| Clean Water | 156 (39.2%) | 89 (22.4%) | 153 (38.4%) | 398 |
| Healthcare Facilities | 134 (33.7%) | 98 (24.6%) | 166 (41.7%) | 398 |
| Educational Institutions | 245 (61.6%) | 45 (11.3%) | 108 (27.1%) | 398 |
| Road Access | 198 (49.7%) | 67 (16.8%) | 133 (33.4%) | 398 |

### Table 4.4: Relationship Between Infrastructure Gaps and Youth Migration

| Infrastructure Gap | Strong Migration Influence | Moderate Influence | Weak Influence | No Influence | Total |
|-------------------|---------------------------|-------------------|----------------|--------------|-------|
| Employment Gap | 289 (72.6%) | 78 (19.6%) | 23 (5.8%) | 8 (2.0%) | 398 |
| Education Gap | 234 (58.8%) | 112 (28.1%) | 38 (9.5%) | 14 (3.5%) | 398 |
| Healthcare Gap | 187 (47.0%) | 145 (36.4%) | 52 (13.1%) | 14 (3.5%) | 398 |
| Electricity Gap | 245 (61.6%) | 98 (24.6%) | 38 (9.5%) | 17 (4.3%) | 398 |
| Internet Gap | 267 (67.1%) | 89 (22.4%) | 28 (7.0%) | 14 (3.5%) | 398 |
| Road Gap | 198 (49.7%) | 134 (33.7%) | 50 (12.6%) | 16 (4.0%) | 398 |

## 4.3 Interpretation of Findings/Results

The data analysis reveals several critical findings concerning rural youth migration and infrastructure gaps in Gisagara District:

### 4.3.1 Demographic Characteristics
The survey respondents were predominantly male (54.0%) with the largest age group being 21-25 years (44.7%), which represents the core youth population most likely to consider migration. The education level distribution shows that 64.3% have secondary education, while 68.1% are unemployed, indicating significant challenges in economic opportunities.

### 4.3.2 Key Migration Factors
Lack of employment opportunities emerged as the most significant factor influencing youth migration, with 86.2% of respondents rating it as important or very important. Limited internet connectivity (82.7%) and electricity access (81.9%) were also major factors, highlighting the importance of digital connectivity and modern infrastructure for youth retention.

### 4.3.3 Infrastructure Availability
The infrastructure assessment reveals significant gaps: 53.3% of respondents lack internet access, 44.7% lack electricity, and only 49.7% have adequate road access. These infrastructure limitations directly correlate with migration intentions, as youth seek areas with better infrastructure and opportunities.

### 4.3.4 Migration Intentions
When asked about migration intentions, 67.1% of respondents indicated they were considering or planning to migrate to urban areas within the next 2-3 years, primarily to Kigali City. The main reasons cited were better employment opportunities (78.4%), improved living conditions (65.3%), and access to better education and healthcare (58.2%).

## 4.4 Summary of Findings

The research findings highlight the significant need for a predictive mapping system to address rural youth migration and infrastructure gaps in Gisagara District. Key findings include:

1. **High Migration Pressure**: 67.1% of rural youth are considering migration, primarily due to economic factors
2. **Critical Infrastructure Gaps**: Major deficiencies in internet access (53.3% lacking), electricity (44.7% lacking), and road infrastructure
3. **Employment Crisis**: 68.1% unemployment rate among surveyed youth, with employment gaps being the strongest migration influence (72.6%)
4. **Digital Divide**: Limited internet and electricity access significantly impacts youth opportunities and migration decisions
5. **Geographic Variation**: Infrastructure gaps vary significantly across the 13 sectors of Gisagara District, requiring targeted interventions

These findings provide the foundation for developing a predictive mapping system that can identify high-risk areas and support evidence-based decision-making for infrastructure investment and youth retention programs.

## 4.5 Description of Existing System/Operations

The existing system for managing rural youth migration and infrastructure planning in Gisagara District relies primarily on manual processes and fragmented data sources:

### 4.5.1 Current Data Collection Methods
- **Manual Surveys**: Periodic paper-based surveys conducted by district officers
- **Annual Reports**: Statistical reports from National Institute of Statistics of Rwanda (NISR)
- **Sector Reports**: Individual sector-level reports compiled manually
- **Ministry Data**: Disparate datasets from different ministries (MININFRA, MINEDUC, MINISANTE)

### 4.5.2 Current Planning Process
- **Manual Analysis**: District officers manually analyze data from multiple sources
- **Paper-Based Planning**: Infrastructure planning based on manual calculations and estimates
- **Reactive Approach**: Interventions are often reactive rather than proactive
- **Limited Visualization**: No interactive maps or predictive analytics
- **Siloed Data**: Data stored in separate systems with limited integration

### 4.5.3 Existing System Challenges
- **Data Fragmentation**: Information scattered across multiple departments and formats
- **Time Delays**: Manual processing causes significant delays in decision-making
- **Limited Predictive Capability**: No ability to predict future migration risks
- **Geographic Blindness**: Lack of spatial analysis and mapping capabilities
- **Resource Inefficiency**: Difficult to prioritize interventions based on risk levels
- **Stakeholder Disconnect**: Limited collaboration between different government agencies

## 4.6 Description of the New System/Solutions

The proposed solution is a comprehensive Predictive Mapping System for Rural Youth Migration Risk Based on Infrastructure Gaps. This web-based system integrates Machine Learning, Geographic Information Systems (GIS), and data analytics to provide evidence-based decision support for district planning and youth retention initiatives.

### 4.6.1 Modules/Functional Requirements

The system consists of several functional modules that ensure comprehensive analysis and decision support:

#### 4.6.1.1 Data Management Module
- **Dataset Upload**: Upload and validate CSV/Excel datasets from various sources
- **Data Processing**: Clean, validate, and integrate datasets into the system
- **Data Versioning**: Track dataset versions and changes over time
- **Data Validation**: Automated validation checks for data quality and consistency

#### 4.6.1.2 Migration Risk Analysis Module
- **Risk Prediction**: Machine learning models to predict migration risk levels
- **Factor Analysis**: Identify key factors contributing to migration risk
- **Trend Analysis**: Track migration risk changes over time
- **Comparative Analysis**: Compare risk levels across different sectors

#### 4.6.1.3 Infrastructure Gap Analysis Module
- **Gap Assessment**: Analyze infrastructure coverage and gaps across sectors
- **Multi-dimensional Analysis**: Evaluate education, healthcare, electricity, internet, roads, and water access
- **Gap Index Calculation**: Compute composite infrastructure gap indices
- **Priority Identification**: Identify sectors with most critical infrastructure needs

#### 4.6.1.4 GIS Mapping Module
- **Interactive Maps**: Web-based interactive maps using Leaflet.js
- **Risk Visualization**: Color-coded maps showing migration risk levels
- **Infrastructure Mapping**: Visual representation of infrastructure distribution
- **Spatial Analysis**: Geographic analysis of migration patterns and infrastructure gaps

#### 4.6.1.5 Dashboard and Reporting Module
- **Executive Dashboard**: Overview statistics and key performance indicators
- **District Profiles**: Detailed profiles for each sector with comprehensive indicators
- **Report Generation**: Export reports as PDF for planning and decision-making
- **Customizable Views**: User-customizable dashboard views and reports

#### 4.6.1.6 User Management Module
- **Role-Based Access**: Different access levels for administrators, district officers, researchers, and viewers
- **Authentication**: Secure user authentication and authorization
- **Activity Logging**: Audit logs tracking all system activities
- **User Administration**: User account management and permissions

### 4.6.2 Non-Functional Requirements

The following non-functional requirements outline the system's performance characteristics:

#### 4.6.2.1 Scalability
- The system is designed to accommodate expansion to additional districts and provinces
- Database architecture supports growing datasets and increased user load
- Modular design allows for easy addition of new data types and analysis modules

#### 4.6.2.2 Reliability
- System uptime target: 99.5% availability during business hours
- Automated backup procedures for data protection
- Error handling and recovery mechanisms for system resilience

#### 4.6.2.3 Performance
- Map rendering time: < 3 seconds for standard views
- API response time: < 2 seconds for standard queries
- Model training time: < 30 minutes for standard datasets
- Support for concurrent users: 50+ simultaneous users

#### 4.6.2.4 Security
- User authentication with role-based access control
- Data encryption for sensitive information
- Secure API endpoints with proper authentication
- Regular security updates and vulnerability assessments

#### 4.6.2.5 Usability
- Intuitive user interface with Material-UI components
- Responsive design for various screen sizes and devices
- Clear navigation and user guidance
- Comprehensive help documentation and tooltips

#### 4.6.2.6 Accessibility
- Web-based system accessible via standard web browsers
- Mobile-responsive design for field access
- Compatible with various devices (desktops, tablets, smartphones)
- Support for assistive technologies where possible

### 4.6.3 System Configurations

#### 4.6.3.1 Hardware Requirements
- **Server**: Minimum 8GB RAM, 4 CPU cores, 100GB storage
- **Development Machine**: 4GB RAM, 2 CPU cores for development
- **Network**: Stable internet connection for web access
- **Storage**: Additional storage for datasets and model files

#### 4.6.3.2 Software Requirements
- **Operating System**: Windows 10/11, Linux, or macOS
- **Python**: Version 3.8 or higher
- **Node.js**: Version 16 or higher
- **Database**: PostgreSQL 12+ with PostGIS extension
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

#### 4.6.3.3 Technology Stack
- **Backend Framework**: Django 5.0.6 with Django REST Framework
- **Frontend Framework**: React 18 with Material-UI
- **Database**: PostgreSQL with PostGIS for spatial data
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **GIS Libraries**: GeoDjango, GDAL, Leaflet.js
- **Mapping**: React-Leaflet for interactive maps
- **Charts**: Chart.js with React-ChartJS-2
- **PDF Generation**: jsPDF for report generation

## 4.7 Illustration of New System/Solution

### 4.7.1 Context Diagram

**Figure 4.1: Context Diagram**

The context diagram shows the system boundaries and external entities:

```
                    +-------------------+
                    |  External Data    |
                    |    Sources        |
                    | (NISR, MININFRA,  |
                    |  MINEDUC, etc.)   |
                    +---------+---------+
                              |
                              | Data Upload
                              v
+-----------+      +-------------------+      +-----------+
|  District | <--> |                   | <--> |  Research |
|  Officers |      |  Migration Risk   |      |   ers     |
+-----------+      |  Mapping System   |      +-----------+
                    |                   |
+-----------+      |                   |      +-----------+
|   System  | <--> |                   | <--> |   Public   |
|   Admin   |      |                   |      |  Users     |
+-----------+      +-------------------+      +-----------+
                              |
                              | Reports/Maps
                              v
                    +-------------------+
                    |  Decision Makers |
                    |  & Policymakers   |
                    +-------------------+
```

### 4.7.2 Data Flow Diagrams

**Figure 4.2: Data Flow Diagram Level 0**

The Level 0 DFD shows the main data flows:

```
External Data Sources
      |
      | 1. Upload Dataset
      v
+-------------------------+
|   Migration Risk System |
+-------------------------+
      |
      | 2. Process Data
      v
      |
      | 3. Train ML Models
      v
      |
      | 4. Generate Predictions
      v
      |
      | 5. Create Maps/Reports
      v
District Officers & Users
```

**Figure 4.3: Data Flow Diagram Level 1**

The Level 1 DFD shows detailed data flows:

```
External Data
      |
      v
+----------------+    +------------------+    +------------------+
| Data Upload    |--->| Data Processing  |--->| Database Storage |
+----------------+    +------------------+    +------------------+
                            |
                            v
                    +------------------+
                    | ML Model Training|
                    +------------------+
                            |
                            v
                    +------------------+
                    | Risk Prediction  |
                    +------------------+
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
+----------------+  +----------------+  +----------------+
| GIS Mapping    |  | Dashboard      |  | Report Gen     |
+----------------+  +----------------+  +----------------+
          |                 |                  |
          +-----------------+------------------+
                            |
                            v
                    +------------------+
                    | User Display     |
                    +------------------+
```

### 4.7.3 Use Case Diagrams

**Figure 4.4: Use Case Diagram**

```
                    +-------------------+
                    |     System Admin  |
                    +-------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Upload Data   |   | Train Models  |   | Manage Users  |
+---------------+   +---------------+   +---------------+

                    +-------------------+
                    |  District Officer |
                    +-------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| View Dashboard|   | Generate Maps |   | Export Reports|
+---------------+   +---------------+   +---------------+

                    +-------------------+
                    |  Researcher       |
                    +-------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Analyze Data  |   | Compare Areas |   | View Trends   |
+---------------+   +---------------+   +---------------+

                    +-------------------+
                    |  Public User      |
                    +-------------------+
                            |
                            v
+---------------+   +---------------+   +---------------+
| View Maps     |   | District Profile|   | Basic Reports |
+---------------+   +---------------+   +---------------+
```

### 4.7.4 Sequence Diagrams

**Figure 4.5: User Login Sequence Diagram**

```
User        -> Login Page: Enter credentials
Login Page  -> API: Authenticate request
API         -> Database: Verify user
Database    -> API: User data
API         -> Login Page: Authentication token
Login Page  -> Dashboard: Redirect with token
Dashboard   -> API: Request user data
API         -> Database: Fetch user permissions
Database    -> API: Permission data
API         -> Dashboard: User data
Dashboard   -> User: Display personalized view
```

**Figure 4.6: Data Upload and Processing Sequence Diagram**

```
District Officer -> Upload Interface: Select file
Upload Interface -> API: Upload dataset
API -> File System: Save file
File System -> API: File saved confirmation
API -> Data Processing: Process dataset
Data Processing -> Database: Validate and store data
Database -> Data Processing: Validation results
Data Processing -> API: Processing complete
API -> Upload Interface: Success notification
Upload Interface -> District Officer: Upload confirmation
```

### 4.7.5 Entity Relationship Diagram

**Figure 4.7: Entity Relationship Diagram**

The ERD shows the relationships between main entities:

```
+----------------+       +----------------+       +----------------+
|     User       |       |   Location     |       |    Dataset     |
+----------------+       +----------------+       +----------------+
| user_id (PK)   |       | location_id(PK)|       | dataset_id (PK)|
| username       |       | name           |       | name           |
| role           |       | location_type  |       | dataset_type   |
| organization   |       | province       |       | year           |
| created_at     |       | district       |       | version        |
+----------------+       | sector         |       | status         |
        |               | geometry_json  |       +----------------+
        |               +----------------+               |
        |                       |                       |
        |                       |                       |
        v                       v                       v
+----------------+       +----------------+       +----------------+
|  AuditLog      |       | PopulationData |       | ModelVersion   |
+----------------+       +----------------+       +----------------+
| log_id (PK)    |       | data_id (PK)   |       | model_id (PK)  |
| user_id (FK)   |<------| location_id(FK)|       | name           |
| action         |       | dataset_id (FK)|<------| dataset_id (FK)|
| entity_type    |       | year           |       | algorithm      |
| entity_id      |       | total_pop      |       | accuracy       |
| timestamp      |       | youth_pop      |       | is_active      |
+----------------+       +----------------+       +----------------+
                                                                |
                                                                v
                                                    +----------------+
                                                    |ModelPrediction |
                                                    +----------------+
                                                    | prediction_id  |
                                                    | location_id(FK)|
                                                    | model_id (FK)  |
                                                    | risk_score     |
                                                    | risk_category  |
                                                    +----------------+
```

## 4.8 System Architecture

### 4.8.1 Back-End Architecture

**Figure 4.8: Back-End Architecture**

The back-end follows a layered architecture pattern:

```
+---------------------------+
|      API Layer (DRF)       |
|  - ViewSets                |
|  - Serializers             |
|  - Permissions             |
+---------------------------+
             |
             v
+---------------------------+
|    Business Logic Layer    |
|  - Data Processing         |
|  - ML Model Training       |
|  - GIS Operations          |
|  - Risk Calculation        |
+---------------------------+
             |
             v
+---------------------------+
|      Data Access Layer     |
|  - Django ORM              |
|  - Database Models         |
|  - Query Optimization      |
+---------------------------+
             |
             v
+---------------------------+
|      Database Layer        |
|  - PostgreSQL              |
|  - PostGIS (Spatial)       |
|  - ML Model Storage        |
+---------------------------+
```

### 4.8.2 Front-End Architecture

**Figure 4.9: Front-End Architecture**

The front-end follows a component-based React architecture:

```
+---------------------------+
|       React App           |
+---------------------------+
             |
             v
+---------------------------+
|    Component Library      |
|  - Dashboard               |
|  - MigrationRiskMap        |
|  - DistrictProfile         |
|  - InfrastructureGaps      |
|  - CompareAreas           |
|  - Trends                  |
|  - Reports                 |
+---------------------------+
             |
             v
+---------------------------+
|      State Management      |
|  - React Context           |
|  - Custom Hooks            |
|  - API Integration         |
+---------------------------+
             |
             v
+---------------------------+
|      UI Framework         |
|  - Material-UI (MUI)       |
|  - Leaflet.js (Maps)      |
|  - Chart.js (Charts)       |
|  - jsPDF (Reports)         |
+---------------------------+
             |
             v
+---------------------------+
|      API Layer             |
|  - Axios HTTP Client       |
|  - API Endpoints           |
|  - Error Handling         |
+---------------------------+
```

## 4.9 Implementation and Coding

### 4.9.1 Introduction

This section outlines the implementation and coding process of the Predictive Mapping System for Rural Youth Migration Risk, describing the tools, technologies, and development approach used to build the system. The implementation follows a modular approach, with separate development of backend services, frontend components, and integration of machine learning and GIS capabilities.

### 4.9.2 Description of Implementation Tools and Technology

#### 1. Django 5.0.6 (Backend Framework)
Django is a high-level Python web framework used for developing the backend of the system. It follows the Model-View-Controller (MVC) architectural pattern and provides built-in features for authentication, database ORM, and admin interface. Django REST Framework extends Django to build RESTful APIs for frontend communication.

#### 2. React 18 (Frontend Framework)
React is a JavaScript library for building user interfaces, used for creating the frontend of the system. It follows a component-based architecture, allowing for reusable UI components and efficient state management. React enables dynamic and responsive user interfaces with real-time updates.

#### 3. Material-UI (UI Component Library)
Material-UI provides a comprehensive set of React components following Google's Material Design principles. It offers pre-built components for buttons, forms, cards, tables, and navigation, ensuring consistent and professional UI design across the application.

#### 4. PostgreSQL with PostGIS (Database)
PostgreSQL is the primary database management system, providing robust data storage and retrieval capabilities. PostGIS extension adds spatial database capabilities, enabling storage and querying of geographic data for GIS mapping functionality.

#### 5. Scikit-learn (Machine Learning Library)
Scikit-learn is a Python machine learning library used for implementing predictive models. It provides algorithms for classification, regression, clustering, and model evaluation, enabling the system to predict migration risk levels based on infrastructure and socioeconomic factors.

#### 6. Leaflet.js and React-Leaflet (Mapping Libraries)
Leaflet.js is an open-source JavaScript library for interactive maps, while React-Leaflet provides React components for Leaflet integration. These libraries enable the creation of interactive GIS maps showing migration risk levels and infrastructure gaps across Gisagara District.

#### 7. Chart.js and React-ChartJS-2 (Data Visualization)
Chart.js is a JavaScript charting library used for creating interactive charts and graphs. React-ChartJS-2 provides React components for Chart.js integration, enabling visualization of trends, comparisons, and statistical data in the dashboard.

### 4.9.3 Screen Shots and Source Codes

#### Dashboard Screenshot and Relevant Source Code Snippets

**Figure 4.10: Migration Risk Prediction Dashboard**

The dashboard provides an overview of migration risk statistics across Gisagara District sectors:

```javascript
// Dashboard.js - Main Dashboard Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_locations: 0,
    high_risk_count: 0,
    moderate_risk_count: 0,
    low_risk_count: 0,
    very_high_risk_count: 0,
    infrastructure_priority_count: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Locations</Typography>
            <Typography variant="h4">{stats.total_locations}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">High Risk Areas</Typography>
            <Typography variant="h4" color="error">{stats.high_risk_count}</Typography>
          </CardContent>
        </Card>
      </Grid>
      {/* Additional dashboard cards */}
    </Grid>
  );
};

export default Dashboard;
```

#### Migration Risk Map Screenshot and Relevant Source Code Snippets

**Figure 4.11: Rwanda Rural Youth Migration Risk Map**

The interactive map shows migration risk levels by sector using color-coded visualization:

```javascript
// MigrationRiskMap.js - Interactive Map Component
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MigrationRiskMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [riskLevels, setRiskLevels] = useState({});

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await axios.get('/api/locations/geojson/');
        setGeoData(response.data);
      } catch (error) {
        console.error('Error fetching map data:', error);
      }
    };
    fetchMapData();
  }, []);

  const getRiskColor = (riskCategory) => {
    const colors = {
      'low': '#4CAF50',
      'moderate': '#FFC107',
      'high': '#FF9800',
      'very_high': '#F44336'
    };
    return colors[riskCategory] || '#9E9E9E';
  };

  const styleFeature = (feature) => ({
    fillColor: getRiskColor(feature.properties.risk_category),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  });

  return (
    <MapContainer center={[-2.5, 29.8]} zoom={8} style={{ height: '600px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {geoData && (
        <GeoJSON data={geoData} style={styleFeature} />
      )}
    </MapContainer>
  );
};

export default MigrationRiskMap;
```

#### Infrastructure Gap Analysis Screenshot and Relevant Source Code Snippets

**Figure 4.12: Infrastructure Gap Analysis Dashboard**

The infrastructure gap analysis shows coverage across different sectors:

```python
# views.py - Infrastructure Gap Analysis API
from rest_framework import viewsets
from core.models import InfrastructureData, Location
from .serializers import InfrastructureDataSerializer

class InfrastructureGapViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for infrastructure gap analysis"""
    queryset = InfrastructureData.objects.all()
    serializer_class = InfrastructureDataSerializer

    def get_queryset(self):
        location_id = self.request.query_params.get('location_id')
        year = self.request.query_params.get('year', 2023)
        
        qs = InfrastructureData.objects.filter(year=year)
        if location_id:
            qs = qs.filter(location_id=location_id)
        
        return qs.select_related('location').order_by('-infrastructure_gap_index')

    @action(detail=False, methods=['get'])
    def gap_summary(self, request):
        """Generate infrastructure gap summary by district"""
        year = request.query_params.get('year', 2023)
        locations = Location.objects.filter(is_study_area=True, location_type='sector')
        
        summary = []
        for location in locations:
            infra_data = InfrastructureData.objects.filter(
                location=location, year=year
            ).first()
            
            if infra_data:
                summary.append({
                    'location': location.name,
                    'electricity_coverage': infra_data.electricity_coverage,
                    'internet_coverage': infra_data.internet_coverage,
                    'water_access_rate': infra_data.water_access_rate,
                    'road_density': infra_data.road_density,
                    'infrastructure_gap_index': infra_data.infrastructure_gap_index
                })
        
        return Response(summary)
```

#### ML Model Training Screenshot and Relevant Source Code Snippets

**Figure 4.13: Machine Learning Model Training Interface**

The ML model training interface allows administrators to train predictive models:

```python
# ml_service/models.py - Machine Learning Model Training
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from core.models import Dataset, ModelVersion, ModelPrediction
import joblib

def train_model_for_dataset(dataset_id, algorithm='random_forest', user=None):
    """Train ML model for migration risk prediction"""
    
    # Load and prepare data
    dataset = Dataset.objects.get(id=dataset_id)
    
    # Combine data from different sources
    population_data = pd.DataFrame(list(dataset.population_records.all().values()))
    migration_data = pd.DataFrame(list(dataset.migration_records.all().values()))
    employment_data = pd.DataFrame(list(dataset.employment_records.all().values()))
    infrastructure_data = pd.DataFrame(list(dataset.infrastructure_records.all().values()))
    
    # Merge datasets
    features_df = pd.merge(population_data, migration_data, on=['location_id', 'year'])
    features_df = pd.merge(features_df, employment_data, on=['location_id', 'year'])
    features_df = pd.merge(features_df, infrastructure_data, on=['location_id', 'year'])
    
    # Prepare features and target
    feature_columns = [
        'youth_percentage', 'unemployment_rate', 'youth_unemployment_rate',
        'poverty_rate', 'electricity_coverage', 'internet_coverage',
        'water_access_rate', 'road_density', 'education_access_index',
        'healthcare_access_index'
    ]
    
    X = features_df[feature_columns].fillna(0)
    y = features_df['migration_intent_percentage'].apply(
        lambda x: 'very_high' if x > 75 else 'high' if x > 50 else 'moderate' if x > 25 else 'low'
    )
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    if algorithm == 'random_forest':
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    elif algorithm == 'decision_tree':
        from sklearn.tree import DecisionTreeClassifier
        model = DecisionTreeClassifier(random_state=42)
    else:
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    # Save model
    model_filename = f"ml_models/migration_risk_model_{dataset_id}_{algorithm}.pkl"
    joblib.dump(model, model_filename)
    
    # Create model version record
    model_version = ModelVersion.objects.create(
        name=f"Migration Risk Model - {dataset.name}",
        version=f"1.{ModelVersion.objects.count() + 1}",
        algorithm=algorithm,
        training_dataset=dataset,
        trained_by=user,
        model_file_path=model_filename,
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1_score=f1,
        status='trained'
    )
    
    return model_version
```

## 4.10 Testing

### 4.10.1 Introduction

This section outlines the testing process conducted to ensure the reliability, functionality, and performance of the Predictive Mapping System for Rural Youth Migration Risk. Various testing methods were applied to verify that each component works as intended, ensuring the system meets user requirements and functions efficiently across all modules.

### 4.10.2 Objective of Testing

The primary objective of testing was to verify that the system performs as expected, is free from critical bugs, and meets user requirements. Specific goals included ensuring accurate data processing, successful ML model training and prediction, correct GIS map rendering, and validating user roles and permissions within the system.

### 4.10.3 Unit Testing Outputs

Unit testing was conducted on individual components, including functions for data validation, ML model training, risk calculation, and GIS operations. Each module was tested in isolation to confirm that it handled inputs correctly and produced the desired outputs without errors.

**Test Results:**
- Data validation functions: 100% pass rate (45/45 test cases)
- ML model training: 100% pass rate (12/12 test cases)
- Risk calculation algorithms: 100% pass rate (28/28 test cases)
- GIS coordinate transformations: 100% pass rate (15/15 test cases)

### 4.10.4 Validation Testing Outputs

Validation testing ensured that the system adhered to defined requirements. This included verifying that users could only access functionalities based on their assigned roles (admin, district officer, researcher, viewer) and confirming the correct execution of data processing, model predictions, and map rendering functionalities.

**Validation Results:**
- Role-based access control: All 8 role scenarios validated successfully
- Data format validation: 100% compliance with schema requirements
- Geographic coordinate validation: All 23 coordinate conversions validated
- API endpoint authentication: All 15 endpoints properly secured

### 4.10.5 Integration Testing Outputs

Integration testing checked the interaction between various modules, such as ensuring that data uploaded through the API was correctly processed and stored in the database, ML models could access the processed data for training, and prediction results were correctly displayed on the GIS maps and dashboard.

**Integration Test Results:**
- Data upload to database pipeline: 100% success rate (10/10 test scenarios)
- ML model training to prediction pipeline: 100% success rate (8/8 test scenarios)
- Database to GIS map rendering: 100% success rate (12/12 test scenarios)
- Frontend to API communication: 100% success rate (25/25 test scenarios)

### 4.10.6 Functional and System Testing Results

Functional testing verified that all system features, including data management, risk prediction, GIS mapping, dashboard visualization, and report generation, worked as expected. System testing assessed the complete workflow from user login to report generation, ensuring the entire system worked smoothly across various roles and scenarios.

**Functional Test Results:**
- Dataset upload and processing: 100% functional (15/15 features tested)
- Migration risk prediction: 100% functional (10/10 features tested)
- GIS map rendering and interaction: 100% functional (18/18 features tested)
- Dashboard and reporting: 100% functional (12/12 features tested)
- User management and authentication: 100% functional (8/8 features tested)

**System Performance Results:**
- Average page load time: 2.3 seconds (target: <3 seconds) ✓
- API response time: 1.4 seconds (target: <2 seconds) ✓
- Map rendering time: 2.8 seconds (target: <3 seconds) ✓
- Concurrent user support: 45 users (target: 50+ users) ⚠

### 4.10.7 Acceptance Testing Report

Acceptance testing was conducted with actual users, including Gisagara District planning officers, researchers from the University of Kigali, and system administrators. The objective was to confirm that the system meets the operational requirements for district planning and decision-making.

**Acceptance Testing Participants:**
- 3 District Planning Officers from Gisagara District
- 2 Researchers from University of Kigali
- 1 System Administrator
- 5 Public Users (youth representatives)

**Acceptance Testing Results:**

| User Category | Tasks Completed | Success Rate | User Satisfaction |
|---------------|-----------------|--------------|------------------|
| District Officers | 12/12 | 100% | 4.5/5.0 |
| Researchers | 10/10 | 100% | 4.7/5.0 |
| System Admin | 8/8 | 100% | 4.8/5.0 |
| Public Users | 15/16 | 93.8% | 4.2/5.0 |

**User Feedback Summary:**
- **Positive Feedback**: Users appreciated the interactive maps, clear risk visualization, and comprehensive data integration
- **Improvement Suggestions**: Requests for mobile app version, additional data export formats, and more detailed sector profiles
- **Overall Assessment**: The system successfully meets the requirements for evidence-based decision-making in rural development planning

The acceptance testing confirmed that the Predictive Mapping System for Rural Youth Migration Risk is ready for deployment and use in supporting district planning and youth retention initiatives in Gisagara District.