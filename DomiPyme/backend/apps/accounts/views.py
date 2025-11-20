from rest_framework import generics, status
from .serializers import RegisterSerializer
from rest_framework.response import Response

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []  # allow anyone to register

    def create(self, request, *args, **kwargs):
        """
        Returns 201 with user data (no password) on success.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"email": user.email, "id": user.id}, status=status.HTTP_201_CREATED)
