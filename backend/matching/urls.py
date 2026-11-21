from django.urls import path
from .views import MatchingProvidersView

urlpatterns = [
    path('providers/', MatchingProvidersView.as_view(), name='matching-providers'),
]
