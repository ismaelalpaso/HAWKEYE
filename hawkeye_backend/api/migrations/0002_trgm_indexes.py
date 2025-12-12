from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # <-- cámbialo por tu última migración existente
    ]

    operations = [

        # -----------------------------------------------------
        # 1️⃣ Activar extensión pg_trgm
        # -----------------------------------------------------
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            reverse_sql="DROP EXTENSION IF EXISTS pg_trgm;"
        ),

        # -----------------------------------------------------
        # 2️⃣ TRGM INDEXES — CLIENTE
        # -----------------------------------------------------

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_cliente_nombre_trgm
            ON api_cliente
            USING gin (nombre_apellidos_completo gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_cliente_nombre_trgm;"
        ),

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_cliente_nombresimple_trgm
            ON api_cliente
            USING gin (nombre_apellido gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_cliente_nombresimple_trgm;"
        ),

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_cliente_nombreconcat_trgm
            ON api_cliente
            USING gin ((nombre || ' ' || apellido1 || ' ' || COALESCE(apellido2, '')) gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_cliente_nombreconcat_trgm;"
        ),

        # -----------------------------------------------------
        # 3️⃣ TRGM INDEXES — EDIFICIO
        # -----------------------------------------------------

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_edif_calle_trgm
            ON api_edificio
            USING gin (calle gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_edif_calle_trgm;"
        ),

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_edif_numero_trgm
            ON api_edificio
            USING gin (numero_calle gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_edif_numero_trgm;"
        ),

        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_edif_fulladdr_trgm
            ON api_edificio
            USING gin ((calle || ' ' || numero_calle) gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_edif_fulladdr_trgm;"
        ),

        # -----------------------------------------------------
        # 4️⃣ TRGM INDEXES — INMUEBLE
        # -----------------------------------------------------

        # Dirección completa para búsquedas tipo “major 12 3º2ª”
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_inmueble_direccion_trgm
            ON api_inmueble
            USING gin (direccion_busqueda gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_inmueble_direccion_trgm;"
        ),

        # Ref catastral fuzzy (“12345ABC1234G0001WX”)
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_inmueble_refcat_trgm
            ON api_inmueble
            USING gin (ref_catastral gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_inmueble_refcat_trgm;"
        ),

        # Dirección combinada: calle + número + planta + puerta
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS idx_inmueble_fulladdr_trgm
            ON api_inmueble
            USING gin (
                (
                    direccion_busqueda || ' ' ||
                    planta || ' ' ||
                    COALESCE(puerta, '')
                ) gin_trgm_ops
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_inmueble_fulladdr_trgm;"
        ),
    ]
