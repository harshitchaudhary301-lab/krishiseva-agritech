from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Avg
from .models import ServiceCategory, Village, ProviderService, Review
from .serializers import ServiceCategorySerializer, VillageSerializer, ProviderServiceSerializer, ReviewSerializer
from accounts.models import User
from accounts.serializers import UserSerializer

class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.all().order_by('display_order', 'id')
    serializer_class = ServiceCategorySerializer
    pagination_class = None


class VillageListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Village.objects.all().order_by('name')
    serializer_class = VillageSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        district = self.request.query_params.get('district')
        if district:
            qs = qs.filter(district__iexact=district)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class ProviderDirectoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        role = request.query_params.get('role', 'provider')
        category_slug = request.query_params.get('category')
        village = request.query_params.get('village')

        qs = User.objects.filter(is_active=True)
        if role in ['worker', 'provider']:
            qs = qs.filter(role=role)
        else:
            qs = qs.filter(role__in=['worker', 'provider'])

        if village:
            qs = qs.filter(Q(village__iexact=village) | Q(provider_profile__service_villages__icontains=village))

        if category_slug:
            if role == 'worker':
                pass # workers can do harvesting/labour
            else:
                qs = qs.filter(
                    Q(provider_profile__service_categories__icontains=category_slug) |
                    Q(services__category__slug=category_slug)
                ).distinct()

        serializer = UserSerializer(qs, many=True)
        return Response(serializer.data)


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        target_id = self.request.query_params.get('target_user')
        if target_id:
            return Review.objects.filter(target_user_id=target_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        target = review.target_user

        # Recalculate average rating
        avg_res = Review.objects.filter(target_user=target).aggregate(avg_score=Avg('rating'))
        new_avg = avg_res['avg_score']
        if new_avg is not None:
            if hasattr(target, 'worker_profile'):
                target.worker_profile.rating = round(new_avg, 2)
                target.worker_profile.save()
            elif hasattr(target, 'provider_profile'):
                target.provider_profile.rating = round(new_avg, 2)
                target.provider_profile.save()
