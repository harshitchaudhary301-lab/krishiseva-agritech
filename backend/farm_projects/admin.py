from django.contrib import admin
from .models import Farm, FarmProject, ProjectService

class ProjectServiceInline(admin.TabularInline):
    model = ProjectService
    extra = 1

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'village', 'district', 'size_acres', 'current_crops')
    search_fields = ('name', 'farmer__username', 'village')
    list_filter = ('district', 'state')

@admin.register(FarmProject)
class FarmProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'crop', 'target_area_acres', 'status', 'start_date', 'estimated_budget', 'actual_cost')
    list_filter = ('status', 'crop')
    search_fields = ('name', 'farmer__username', 'crop')
    inlines = [ProjectServiceInline]

@admin.register(ProjectService)
class ProjectServiceAdmin(admin.ModelAdmin):
    list_display = ('project', 'category', 'service_request', 'target_date')
    list_filter = ('category',)
    search_fields = ('project__name', 'scope_description')
