from rest_framework import exceptions

class TenantMixin:
    """
    Asigna automáticamente franquicia y oficina del usuario.
    Evita 400 silenciosos y da errores claros si no hay tenant configurado.
    """

    def _tenant_info(self):
        user = self.request.user

        if not user.franquicia_id:
            raise exceptions.ValidationError({
                "detail": "Tu usuario NO tiene franquicia asignada. Debes asignarle franquicia y oficina antes de crear objetos."
            })

        return {
            "franquicia": user.franquicia,
            "oficina": user.oficina  # puede ser None
        }

    def perform_create(self, serializer):
        tenant = self._tenant_info()
        serializer.save(**tenant)

    def perform_update(self, serializer):
        tenant = self._tenant_info()
        serializer.save(**tenant)
