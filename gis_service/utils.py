import json
import logging
from core.models import Location

logger = logging.getLogger(__name__)


def import_geojson_boundary(file_path, location_type='district', province=None):
    """Import administrative boundaries from a GeoJSON file into the database."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            geojson = json.load(f)
    except Exception as e:
        return {'success': False, 'error': str(e)}

    features = geojson.get('features', [])
    imported, errors = 0, []

    for idx, feature in enumerate(features):
        try:
            props = feature.get('properties', {})
            name = (props.get('name') or props.get('NAME') or
                    props.get('District') or props.get('Sector') or props.get('ADM2_EN'))
            district = props.get('district') or props.get('District') or props.get('ADM2_EN', '')
            sector = props.get('sector') or props.get('Sector') or props.get('ADM3_EN', '')
            code = str(props.get('code') or props.get('CODE') or props.get('id') or props.get('ADM2_PCODE') or idx)
            prov = province or props.get('province') or props.get('Province') or props.get('ADM1_EN', '')

            if not name:
                errors.append(f"Feature {idx}: missing name")
                continue

            geometry_json = json.dumps(feature.get('geometry', {}))

            location, created = Location.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'location_type': location_type,
                    'province': prov,
                    'district': district,
                    'sector': sector,
                    'geometry_json': geometry_json,
                    'is_study_area': location_type == 'district' and name in Location.STUDY_DISTRICTS,
                }
            )
            imported += 1
        except Exception as e:
            errors.append(f"Feature {idx}: {str(e)}")
            logger.error(f"GeoJSON import error at feature {idx}: {e}")

    return {'success': True, 'imported': imported, 'errors': errors}


def get_location_geojson(location_id):
    """Return parsed GeoJSON geometry for a location."""
    try:
        loc = Location.objects.get(id=location_id)
        return json.loads(loc.geometry_json) if loc.geometry_json else None
    except Location.DoesNotExist:
        return None


def get_risk_map_geojson(year=None, risk_category=None):
    """Build a GeoJSON FeatureCollection with risk prediction properties."""
    from core.models import ModelPrediction

    qs = ModelPrediction.objects.select_related('location').filter(
        location__geometry_json__isnull=False
    ).exclude(location__geometry_json='')

    if year:
        qs = qs.filter(year=year)
    if risk_category:
        qs = qs.filter(risk_category=risk_category)

    features = []
    for pred in qs:
        try:
            geometry = json.loads(pred.location.geometry_json)
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "id": pred.location.id,
                    "name": pred.location.name,
                    "location_type": pred.location.location_type,
                    "province": pred.location.province,
                    "district": pred.location.district,
                    "sector": pred.location.sector,
                    "risk_score": pred.risk_score,
                    "risk_category": pred.risk_category,
                    "year": pred.year,
                }
            })
        except (json.JSONDecodeError, TypeError):
            continue

    return {"type": "FeatureCollection", "features": features}


def get_infrastructure_map_geojson(year=None, threshold=50):
    """Build a GeoJSON FeatureCollection with infrastructure gap properties."""
    from core.models import InfrastructureData

    qs = InfrastructureData.objects.select_related('location').filter(
        location__geometry_json__isnull=False
    ).exclude(location__geometry_json='')

    if year:
        qs = qs.filter(year=year)

    features = []
    for infra in qs:
        try:
            geometry = json.loads(infra.location.geometry_json)
            gap = infra.infrastructure_gap_index or 0
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "id": infra.location.id,
                    "name": infra.location.name,
                    "location_type": infra.location.location_type,
                    "province": infra.location.province,
                    "district": infra.location.district,
                    "infrastructure_gap_index": gap,
                    "electricity_coverage": infra.electricity_coverage or 0,
                    "internet_coverage": infra.internet_coverage or 0,
                    "water_access_rate": infra.water_access_rate or 0,
                    "road_density": infra.road_density or 0,
                    "year": infra.year,
                    "is_priority": gap >= threshold,
                }
            })
        except (json.JSONDecodeError, TypeError):
            continue

    return {"type": "FeatureCollection", "features": features}


def get_overlapping_high_risk_areas(year=None):
    """Find areas where high migration risk overlaps with significant infrastructure gaps."""
    from core.models import ModelPrediction, InfrastructureData

    qs = ModelPrediction.objects.filter(risk_category__in=['high', 'very_high'])
    if year:
        qs = qs.filter(year=year)

    results = []
    for pred in qs:
        try:
            infra = InfrastructureData.objects.get(location=pred.location, year=pred.year)
            if infra.infrastructure_gap_index and infra.infrastructure_gap_index >= 50:
                results.append({
                    'location_name': pred.location.name,
                    'district': pred.location.district,
                    'risk_score': pred.risk_score,
                    'risk_category': pred.risk_category,
                    'infrastructure_gap_index': infra.infrastructure_gap_index,
                    'year': pred.year,
                })
        except InfrastructureData.DoesNotExist:
            continue

    return results
