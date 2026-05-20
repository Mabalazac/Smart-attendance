from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClassSessionViewSet, AttendanceRecordViewSet, CheckInView, ActiveSessionView, ReportGenerationView

router = DefaultRouter()
router.register(r'sessions', ClassSessionViewSet, basename='sessions')
router.register(r'records', AttendanceRecordViewSet, basename='records')

urlpatterns = [
    path('', include(router.urls)),
    path('checkin/', CheckInView.as_view(), name='checkin'),
    path('active/', ActiveSessionView.as_view(), name='active-session'),
    path('reports/', ReportGenerationView.as_view(), name='reports'),
]
