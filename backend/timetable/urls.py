from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimetableEntryViewSet, CourseViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'', TimetableEntryViewSet, basename='timetable')

urlpatterns = [
    path('', include(router.urls)),
]
