from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Venue
from .serializers import VenueSerializer
from attendance.models import ClassSession

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer

    @action(detail=False, methods=['get'])
    def free(self, request):
        # A venue is free if it has no active ClassSession
        active_sessions = ClassSession.objects.filter(status='active').values_list('venue_id', flat=True)
        free_venues = Venue.objects.exclude(id__in=active_sessions)
        serializer = self.get_serializer(free_venues, many=True)
        return Response(serializer.data)
