from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "role", "password")
        read_only_fields = ("id",)

    def validate_role(self, value):
        # Open self-signup is limited to patients/trainers; staff is admin-only.
        if value not in (Role.TRAINER, Role.PATIENT):
            raise serializers.ValidationError("Invalid role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    trainer = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(source="is_staff", read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "role", "date_joined", "trainer", "is_admin")
        read_only_fields = fields

    def get_trainer(self, obj):
        if obj.role != Role.PATIENT:
            return None
        profile = getattr(obj, "patient_profile", None)
        trainer = getattr(profile, "assigned_trainer", None) if profile else None
        if not trainer:
            return None
        return {"id": str(trainer.id), "full_name": trainer.full_name, "email": trainer.email}


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embed the role in the JWT and return basic user info on login."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
