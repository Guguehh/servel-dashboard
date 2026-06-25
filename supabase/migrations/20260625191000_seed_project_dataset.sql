insert into public.price_types (code, label, description, unit_label, allows_products)
values
  ('fijo', 'Fijo', 'Cobro por servicio.', null, true),
  ('por_hora', 'Por hora', 'Cobro por hora de trabajo.', 'hora', true),
  ('por_trabajo', 'Por trabajo', 'Cobro por trabajo completo.', 'trabajo', true),
  ('por_dia', 'Por dia', 'Cobro por dia de servicio.', 'dia', true),
  ('por_clase', 'Por clase', 'Cobro por clase.', 'clase', true),
  ('por_semana', 'Por semana', 'Cobro por semana.', 'semana', true),
  ('por_mes', 'Por mes', 'Cobro por mes.', 'mes', true),
  ('por_consulta', 'Por consulta', 'Cobro por consulta.', 'consulta', true),
  ('por_turno_60', 'Por turno (60 min)', 'Cobro por turno de 60 minutos.', 'turno', true),
  ('rango', 'Por rango', 'Cobro por cantidad/rangos.', null, true),
  ('por_m2', 'Por m²', 'Cobro por metro cuadrado.', 'm²', true)
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  unit_label = excluded.unit_label,
  allows_products = excluded.allows_products;

insert into public.admin_settings (key, value)
values
  (
    'ui',
    '{
      "features": {
        "editNumericPrices": false,
        "editProductPrices": false
      },
      "labels": {
        "unidadCotizacion": "Unidad de cotización",
        "duracionEstimada": "Duración estimada",
        "ubicacion": "Ubicación",
        "urgencia": "Urgencia",
        "productos": "Productos",
        "estadoActivo": "Estado (Activo)",
        "camposPersonalizados": "Campos personalizados",
        "configuracionServicio": "Configuración del servicio"
      }
    }'::jsonb
  ),
  ('category_defaults', '{}'::jsonb)
on conflict (key) do nothing;

DO $seed$
DECLARE
  cat_electricidad uuid;
  cat_plomeria uuid;
  cat_pintura uuid;
  cat_limpieza uuid;
  cat_jardineria uuid;
  cat_climatizacion uuid;
  cat_cerrajeria uuid;
  cat_educacion uuid;
  cat_salud uuid;
  cat_alquiler uuid;
BEGIN
  SELECT id INTO cat_electricidad FROM public.categories WHERE name = 'Electricidad' ORDER BY created_at LIMIT 1;
  IF cat_electricidad IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Electricidad') RETURNING id INTO cat_electricidad;
  END IF;

  SELECT id INTO cat_plomeria FROM public.categories WHERE name = 'Plomería' ORDER BY created_at LIMIT 1;
  IF cat_plomeria IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Plomería') RETURNING id INTO cat_plomeria;
  END IF;

  SELECT id INTO cat_pintura FROM public.categories WHERE name = 'Pintura' ORDER BY created_at LIMIT 1;
  IF cat_pintura IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Pintura') RETURNING id INTO cat_pintura;
  END IF;

  SELECT id INTO cat_limpieza FROM public.categories WHERE name = 'Limpieza' ORDER BY created_at LIMIT 1;
  IF cat_limpieza IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Limpieza') RETURNING id INTO cat_limpieza;
  END IF;

  SELECT id INTO cat_jardineria FROM public.categories WHERE name = 'Jardinería' ORDER BY created_at LIMIT 1;
  IF cat_jardineria IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Jardinería') RETURNING id INTO cat_jardineria;
  END IF;

  SELECT id INTO cat_climatizacion FROM public.categories WHERE name = 'Climatización' ORDER BY created_at LIMIT 1;
  IF cat_climatizacion IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Climatización') RETURNING id INTO cat_climatizacion;
  END IF;

  SELECT id INTO cat_cerrajeria FROM public.categories WHERE name = 'Cerrajería' ORDER BY created_at LIMIT 1;
  IF cat_cerrajeria IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Cerrajería') RETURNING id INTO cat_cerrajeria;
  END IF;

  SELECT id INTO cat_educacion FROM public.categories WHERE name = 'Educación' ORDER BY created_at LIMIT 1;
  IF cat_educacion IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Educación') RETURNING id INTO cat_educacion;
  END IF;

  SELECT id INTO cat_salud FROM public.categories WHERE name = 'Salud' ORDER BY created_at LIMIT 1;
  IF cat_salud IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Salud') RETURNING id INTO cat_salud;
  END IF;

  SELECT id INTO cat_alquiler FROM public.categories WHERE name = 'Alquiler' ORDER BY created_at LIMIT 1;
  IF cat_alquiler IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('Alquiler') RETURNING id INTO cat_alquiler;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Electricista a domicilio') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_electricidad,
      'Electricista a domicilio',
      'Plantilla general para trabajos eléctricos.',
      'por_hora',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '["enabled"]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_hora" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": true },
          "productos": { "permite": true }
        },
        "campos": [
          {
            "id": "demo-fld-1",
            "nombre": "Tipo de trabajo",
            "tipo": "dropdown",
            "obligatorio": true,
            "opciones": [
              { "id": "demo-opt-1", "label": "Instalación" },
              { "id": "demo-opt-2", "label": "Reparación" },
              { "id": "demo-opt-3", "label": "Mantenimiento" }
            ]
          },
          { "id": "demo-fld-2", "nombre": "Descripción del problema", "tipo": "texto_largo", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Instalación de Punto de Carga EV') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_electricidad,
      'Instalación de Punto de Carga EV',
      'Plantilla para instalación de cargadores EV.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": true }
        },
        "campos": [
          {
            "id": "demo-fld-3",
            "nombre": "Potencia del cargador",
            "tipo": "dropdown",
            "obligatorio": true,
            "opciones": [
              { "id": "demo-opt-4", "label": "3.6 kW" },
              { "id": "demo-opt-5", "label": "7.4 kW" },
              { "id": "demo-opt-6", "label": "11 kW" }
            ]
          },
          { "id": "demo-fld-4", "nombre": "Marca/Modelo", "tipo": "texto_corto", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Destapación de cañerías') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_plomeria,
      'Destapación de cañerías',
      'Plantilla para destapaciones y obstrucciones.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '["enabled"]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": false, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": true },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-5", "nombre": "Sector", "tipo": "texto_corto", "obligatorio": true },
          { "id": "demo-fld-6", "nombre": "¿Está completamente tapado?", "tipo": "switch", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Pintura interior') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_pintura,
      'Pintura interior',
      'Plantilla para pintura y retoques.',
      'por_m2',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_m2", "permiteRangos": true, "permiteMinimo": true },
          "duracion": { "activo": false, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": false }
        },
        "campos": [
          { "id": "demo-fld-7", "nombre": "Metros cuadrados", "tipo": "numero", "obligatorio": true },
          { "id": "demo-fld-8", "nombre": "¿Incluye techo?", "tipo": "switch", "obligatorio": false }
        ]
      }$$::jsonb,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Limpieza profunda') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_limpieza,
      'Limpieza profunda',
      'Plantilla para limpieza profunda.',
      'por_hora',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_hora" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-9", "nombre": "Ambientes", "tipo": "texto_corto", "obligatorio": true },
          { "id": "demo-fld-10", "nombre": "¿Hay mascotas?", "tipo": "switch", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Corte de césped') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_jardineria,
      'Corte de césped',
      'Plantilla para corte y mantenimiento.',
      'por_m2',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_m2", "permiteRangos": true, "permiteMinimo": true },
          "duracion": { "activo": false, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-11", "nombre": "Metros cuadrados", "tipo": "numero", "obligatorio": true },
          { "id": "demo-fld-12", "nombre": "¿Retiro de residuos?", "tipo": "switch", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Instalación de aire acondicionado') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_climatizacion,
      'Instalación de aire acondicionado',
      'Plantilla para instalación de split.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-13", "nombre": "Frigorías", "tipo": "numero", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Apertura de puerta') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_cerrajeria,
      'Apertura de puerta',
      'Plantilla para aperturas y asistencia.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '["enabled"]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": false, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": true },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-14", "nombre": "Tipo de cerradura", "tipo": "texto_corto", "obligatorio": true }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Reparación de cortocircuito') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_electricidad,
      'Reparación de cortocircuito',
      'Plantilla para diagnóstico de fallas.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '["enabled"]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": true },
          "productos": { "permite": false }
        },
        "campos": [
          { "id": "demo-fld-15", "nombre": "Síntomas", "tipo": "texto_largo", "obligatorio": false }
        ]
      }$$::jsonb,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Instalación de grifería') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_plomeria,
      'Instalación de grifería',
      'Plantilla para instalación o recambio.',
      'por_trabajo',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_trabajo" },
          "duracion": { "activo": true, "obligatorio": false, "tipo": "libre", "modo": "estimada" },
          "modalidad": { "activo": true, "opciones": ["domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": true }
        },
        "campos": [
          { "id": "demo-fld-16", "nombre": "Tipo de grifería", "tipo": "texto_corto", "obligatorio": false }
        ]
      }$$::jsonb,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Clases particulares') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_educacion,
      'Clases particulares',
      'Plantilla para clases (academia, idiomas, música, etc.).',
      'por_clase',
      true,
      false,
      '[]'::jsonb,
      null,
      'Ambos',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_clase" },
          "duracion": { "activo": true, "obligatorio": true, "tipo": "libre", "modo": "exacta" },
          "modalidad": { "activo": true, "opciones": ["virtual", "presencial", "domicilio"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": false }
        },
        "campos": [
          { "id": "demo-fld-17", "nombre": "Cantidad de alumnos", "tipo": "numero", "obligatorio": true },
          {
            "id": "demo-fld-19",
            "nombre": "Nivel de enseñanza",
            "tipo": "dropdown",
            "obligatorio": false,
            "opciones": [
              { "id": "demo-opt-20", "label": "Primario" },
              { "id": "demo-opt-21", "label": "Secundario" },
              { "id": "demo-opt-22", "label": "Universitario" },
              { "id": "demo-opt-23", "label": "Básica" },
              { "id": "demo-opt-24", "label": "Intermedia" },
              { "id": "demo-opt-25", "label": "Avanzada" }
            ]
          },
          { "id": "demo-fld-20", "nombre": "Clases por semana (si aplica)", "tipo": "numero", "obligatorio": false }
        ]
      }$$::jsonb,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Consulta de salud') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_salud,
      'Consulta de salud',
      'Plantilla para consultas (presencial/online) con cobertura médica.',
      'por_consulta',
      true,
      false,
      '[]'::jsonb,
      null,
      'Ambos',
      null,
      '[]'::jsonb,
      null,
      '["enabled"]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_consulta" },
          "duracion": { "activo": true, "obligatorio": true, "tipo": "libre", "modo": "exacta" },
          "modalidad": { "activo": true, "opciones": ["virtual", "presencial"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": true },
          "productos": { "permite": false }
        },
        "campos": [
          {
            "id": "demo-fld-22",
            "nombre": "Duración de la consulta",
            "tipo": "dropdown",
            "obligatorio": true,
            "opciones": [
              { "id": "demo-opt-29", "label": "30 min" },
              { "id": "demo-opt-30", "label": "45 min" },
              { "id": "demo-opt-31", "label": "1 hora" },
              { "id": "demo-opt-32", "label": "Personalizado" }
            ]
          },
          { "id": "demo-fld-23", "nombre": "Cobertura médica", "tipo": "switch", "obligatorio": false }
        ]
      }$$::jsonb,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Alquiler de canchas') THEN
    INSERT INTO public.services (
      category_id, name, description, base_price_type, active, has_quantity_pricing, price_ranges, min_price,
      work_place, previous_requirements, products, duration, emergency, quote_fields, allows_products
    ) VALUES (
      cat_alquiler,
      'Alquiler de canchas',
      'Plantilla para alquiler de canchas por turno con tarifas simples o personalizadas.',
      'por_turno_60',
      true,
      false,
      '[]'::jsonb,
      null,
      'Domicilio',
      null,
      '[]'::jsonb,
      null,
      '[]'::jsonb,
      $${
        "version": 2,
        "config": {
          "precio": { "activo": true, "unidadCode": "por_turno_60", "permiteMinimo": true },
          "duracion": {
            "activo": true,
            "obligatorio": true,
            "tipo": "turno",
            "modo": "estimada",
            "opciones": ["45 min", "60 min", "90 min", "Personalizado"]
          },
          "modalidad": { "activo": true, "opciones": ["presencial"] },
          "ubicacion": { "requiere": true },
          "urgencia": { "permite": false },
          "productos": { "permite": false }
        },
        "campos": [
          { "id": "demo-fld-25", "nombre": "Cantidad de canchas", "tipo": "numero", "obligatorio": true },
          {
            "id": "demo-fld-26",
            "nombre": "Características",
            "tipo": "multiselect",
            "obligatorio": false,
            "opciones": [
              { "id": "demo-opt-37", "label": "Techada" },
              { "id": "demo-opt-38", "label": "Aire libre" },
              { "id": "demo-opt-39", "label": "Estacionamiento" }
            ]
          },
          { "id": "demo-fld-27", "nombre": "Personalizar la tarifa", "tipo": "switch", "obligatorio": false },
          {
            "id": "demo-fld-28",
            "nombre": "Precio fijo (turno 60 min)",
            "tipo": "numero",
            "obligatorio": true,
            "visibleSi": { "dependeDe": "demo-fld-27", "esIgualA": "no" }
          },
          {
            "id": "demo-fld-29",
            "nombre": "Lunes a viernes (día)",
            "tipo": "numero",
            "obligatorio": false,
            "visibleSi": { "dependeDe": "demo-fld-27", "esIgualA": "si" }
          },
          {
            "id": "demo-fld-30",
            "nombre": "Lunes a viernes (noche)",
            "tipo": "numero",
            "obligatorio": false,
            "visibleSi": { "dependeDe": "demo-fld-27", "esIgualA": "si" }
          },
          {
            "id": "demo-fld-31",
            "nombre": "Fines de semana",
            "tipo": "numero",
            "obligatorio": false,
            "visibleSi": { "dependeDe": "demo-fld-27", "esIgualA": "si" }
          },
          { "id": "demo-fld-32", "nombre": "Fotos", "tipo": "fotos", "obligatorio": false },
          { "id": "demo-fld-33", "nombre": "Detalles", "tipo": "texto_largo", "obligatorio": false }
        ]
      }$$::jsonb,
      false
    );
  END IF;
END $seed$;
