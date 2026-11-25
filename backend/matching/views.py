from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from bookings.models import ServiceRequest
from .matcher import match_service_providers, find_matching_providers


class MatchingProvidersView(APIView):
    """
    KS-DEV-SME-001: Service Matching Engine API endpoint.
    Accepts search filters (location, category, dates, capacity, sort)
    or an existing ServiceRequest ID.
    Returns classified matching providers:
    - ELIGIBLE
    - AVAILABILITY_UNKNOWN
    - WIDER_AREA_ALTERNATIVE
    - UNAVAILABLE
    """
    permission_classes = [permissions.AllowAny]

    def _execute_search(self, data):
        # 1. Check if matching for existing ServiceRequest
        request_id = data.get('request_id')
        if request_id:
            service_req = get_object_or_404(ServiceRequest, pk=request_id)
            legacy_matches = find_matching_providers(service_req)
            return {
                'request_id': service_req.id,
                'title': service_req.title,
                'category': service_req.category.name_en,
                'village': service_req.village,
                'required_date': str(service_req.required_date),
                'total_matches': len(legacy_matches),
                'matches': legacy_matches
            }

        # 2. General search parameters
        farm_id = data.get('farm_id')
        field_id = data.get('field_id')
        category = data.get('category') or data.get('category_slug') or data.get('category_id')

        village_id = data.get('village_id')
        village_lgd = data.get('village_lgd') or data.get('village_code')
        village_name = data.get('village_name') or data.get('village')
        subdistrict_id = data.get('subdistrict_id')
        subdistrict_name = data.get('subdistrict_name') or data.get('subdistrict') or data.get('tehsil')
        district_id = data.get('district_id')
        district_name = data.get('district_name') or data.get('district')
        state_id = data.get('state_id')
        state_name = data.get('state_name') or data.get('state')
        is_unverified = data.get('is_unverified', False)

        start_date = data.get('start_date') or data.get('date') or data.get('required_date')
        end_date = data.get('end_date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        quantity = data.get('quantity') or data.get('scope_quantity')
        unit = data.get('unit')
        resource_type = data.get('resource_type')
        sort_by = data.get('sort_by', 'default')

        location_dict = {
            'farm_id': farm_id,
            'field_id': field_id,
            'village_id': village_id,
            'village_lgd': village_lgd,
            'village_name': village_name,
            'subdistrict_id': subdistrict_id,
            'subdistrict_name': subdistrict_name,
            'district_id': district_id,
            'district_name': district_name,
            'state_id': state_id,
            'state_name': state_name,
            'is_unverified': is_unverified,
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude')
        }

        # If category is missing, return error
        if not category:
            return {'error': 'Service category is required for provider matching.', 'status': 400}

        match_result = match_service_providers(
            location=location_dict,
            category=category,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time,
            quantity=quantity,
            unit=unit,
            resource_type=resource_type,
            sort_by=sort_by
        )

        # Pagination
        page = int(data.get('page', 1))
        page_size = min(int(data.get('page_size', 20)), 100)
        total_items = len(match_result['results'])
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        paginated_results = match_result['results'][start_idx:end_idx]

        match_result['pagination'] = {
            'page': page,
            'page_size': page_size,
            'total_items': total_items,
            'total_pages': max(1, (total_items + page_size - 1) // page_size),
            'has_next': end_idx < total_items,
            'has_prev': page > 1
        }
        match_result['results'] = paginated_results
        return match_result

    def get(self, request):
        data = request.query_params.dict()
        res = self._execute_search(data)
        if isinstance(res, dict) and 'error' in res and 'status' in res:
            return Response({'error': res['error']}, status=status.HTTP_400_BAD_REQUEST)
        return Response(res)

    def post(self, request):
        data = request.data
        res = self._execute_search(data)
        if isinstance(res, dict) and 'error' in res and 'status' in res:
            return Response({'error': res['error']}, status=status.HTTP_400_BAD_REQUEST)
        return Response(res)
