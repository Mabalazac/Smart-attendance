from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'avatar',
            'profile_picture', 'student_id', 'staff_id', 'academic_year', 'program', 'stream'
        ]
        extra_kwargs = {
            'profile_picture': {'write_only': True}
        }

    def get_avatar(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            # Fallback if request is not in context
            return f"http://localhost:8000{obj.profile_picture.url}"
        return obj.avatar


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user, context=self.context).data
        if self.user.is_superuser:
            user_data['role'] = 'admin'
        data['user'] = user_data
        return data

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'student_id', 'academic_year', 'program', 'stream']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            student_id=validated_data.get('student_id', ''),
            academic_year=validated_data.get('academic_year'),
            program=validated_data.get('program', ''),
            stream=validated_data.get('stream', ''),
            role='student'
        )
        return user
