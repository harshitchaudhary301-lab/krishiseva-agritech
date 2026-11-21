from django.http import JsonResponse
from django.db import connection


def health_check(request):
    """
    Health check endpoint for Render and uptime monitoring.
    Verifies that the application and database are responsive.
    """
    db_ok = True
    db_error = None
    try:
        connection.ensure_connection()
    except Exception as e:
        db_ok = False
        db_error = str(e)

    status_code = 200 if db_ok else 503
    return JsonResponse({
        "status": "healthy" if db_ok else "unhealthy",
        "service": "KrishiSeva API",
        "database": "connected" if db_ok else f"error: {db_error}",
    }, status=status_code)
