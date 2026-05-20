from django.db import models

class Venue(models.Model):
    name = models.CharField(max_length=100)
    building = models.CharField(max_length=100)
    floor = models.IntegerField(default=1)
    capacity = models.IntegerField()
    type = models.CharField(max_length=50)
    facilities = models.JSONField(default=list, help_text="List of facilities like Projector, AC")
    status = models.CharField(max_length=20, default='free', choices=[('free', 'Free'), ('occupied', 'Occupied'), ('reserved', 'Reserved')])
    
    # Location for distance calculation
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    @property
    def coordinates(self):
        return {
            'lat': self.latitude,
            'lng': self.longitude
        }

    def __str__(self):
        return self.name
