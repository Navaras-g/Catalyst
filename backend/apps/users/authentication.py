from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings


class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        )
        if access_token:
            try:
                validated_token = self.get_validated_token(access_token)
                return self.get_user(validated_token), validated_token
            except TokenError:
                pass

        return super().authenticate(request)