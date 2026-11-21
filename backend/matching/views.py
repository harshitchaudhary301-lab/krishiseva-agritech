from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from bookings.models import ServiceRequest
from .matcher import find_matching_providers

class MatchingProvidersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        request_id = request.query_params.get('request_id')
        if not request_id:
            return Response({'error': 'request_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        service_req = get_object_or_404(ServiceRequest, pk=request_id)
        matches = find_matching_providers(service_req)

        return Response({
            'request_id': service_req.id,
            'title': service_req.title,
            'category': service_req.category.name_en,
            'village': service_req.village,
            'required_date': service_req.required_date,
            'total_matches': len(matches),
            'matches': matches
        })
