from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

TOKEN_EXPIRE_DAYS = getattr(settings, 'TOKEN_EXPIRE_DAYS', 30)

class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Extends DRF TokenAuthentication to provide token expiry and active revocation checks.
    Tokens older than TOKEN_EXPIRE_DAYS (default 30 days) are automatically expired and deleted.
    """
    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related('user').get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed('Invalid or revoked authentication token.')

        if not token.user.is_active:
            raise AuthenticationFailed('User account is deactivated.')

        # Check token expiration
        token_age = timezone.now() - token.created
        if token_age > timedelta(days=TOKEN_EXPIRE_DAYS):
            token.delete()
            raise AuthenticationFailed('Authentication token has expired. Please log in again.')

        return (token.user, token)
