-- Add widget theme, language and button style customization options
-- theme: 'auto' (follows OS preference), 'light', 'dark'
-- language: 'pt-BR', 'en'
-- button_style: 'CIRCLE', 'SQUARE', 'PILL', 'PILL_LABEL', 'HANDLE', 'BUBBLE', 'GRADIENT', 'PILL_COUNTER'

ALTER TABLE canais ADD COLUMN widget_theme VARCHAR(10) NOT NULL DEFAULT 'auto';
ALTER TABLE canais ADD COLUMN widget_language VARCHAR(10) NOT NULL DEFAULT 'pt-BR';
ALTER TABLE canais ADD COLUMN widget_button_style VARCHAR(20) NOT NULL DEFAULT 'CIRCLE';
