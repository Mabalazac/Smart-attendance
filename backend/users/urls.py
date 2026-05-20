from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, StudentRegistrationView, CurrentUserView, DashboardStatsView, UserListView, UserDetailView

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', StudentRegistrationView.as_view(), name='student_register'),
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
