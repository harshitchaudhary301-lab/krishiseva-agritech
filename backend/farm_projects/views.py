import json
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Farm, FarmProject, ProjectService
from .serializers import FarmSerializer, FarmProjectSerializer, ProjectServiceSerializer
from bookings.models import ServiceRequest
from services.models import ServiceCategory

class FarmListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        farms = Farm.objects.filter(farmer=request.user).order_by('-created_at')
        serializer = FarmSerializer(farms, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_farmer() and not request.user.is_superuser:
            return Response({'error': 'Only farmers can register farms.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = FarmSerializer(data=request.data)
        if serializer.is_valid():
            farm = serializer.save(farmer=request.user)
            return Response(FarmSerializer(farm).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmSerializer

    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)


class FarmProjectListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_farmer():
            projects = FarmProject.objects.filter(farmer=user).order_by('-created_at')
        else:
            projects = FarmProject.objects.all().order_by('-created_at')
        serializer = FarmProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_farmer() and not request.user.is_superuser:
            return Response({'error': 'Only registered farmers can create farm projects.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FarmProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(farmer=request.user)

            # Optional: initialize project services if provided in request
            services_data = request.data.get('services', [])
            if isinstance(services_data, str):
                try:
                    services_data = json.loads(services_data)
                except Exception:
                    services_data = []

            if isinstance(services_data, list):
                for item in services_data:
                    if isinstance(item, dict):
                        cat_id = item.get('category_id') or item.get('category')
                        scope = item.get('scope_description', '')
                        t_date = item.get('target_date', project.start_date)
                        if cat_id:
                            try:
                                cat = ServiceCategory.objects.get(id=cat_id)
                                ProjectService.objects.create(
                                    project=project,
                                    category=cat,
                                    scope_description=scope or f"{cat.name_en} for {project.name}",
                                    target_date=t_date
                                )
                            except ServiceCategory.DoesNotExist:
                                pass

            project.update_project_status()
            return Response(FarmProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmProjectDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_farmer():
            return FarmProject.objects.filter(farmer=user)
        return FarmProject.objects.all()


class ProjectAddServiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(FarmProject, pk=pk, farmer=request.user)
        category_id = request.data.get('category')
        scope = request.data.get('scope_description', '')
        target_date = request.data.get('target_date', project.start_date)

        category = get_object_or_404(ServiceCategory, pk=category_id)

        ps = ProjectService.objects.create(
            project=project,
            category=category,
            scope_description=scope,
            target_date=target_date
        )

        # Create linked ServiceRequest automatically if requested
        auto_create_request = request.data.get('create_request', False)
        if auto_create_request:
            req = ServiceRequest.objects.create(
                farmer=request.user,
                category=category,
                farm_project=project,
                title=f"{category.name_en} - {project.name}",
                description=scope or f"Required for {project.crop} project on {project.target_area_acres} acres.",
                village=request.user.village,
                district=request.user.district,
                required_date=target_date,
                scope_quantity=f"{project.target_area_acres} Acres / {scope}",
                budget_max=request.data.get('budget_max')
            )
            ps.service_request = req
            ps.save()

        project.update_project_status()

        return Response(FarmProjectSerializer(project).data)
