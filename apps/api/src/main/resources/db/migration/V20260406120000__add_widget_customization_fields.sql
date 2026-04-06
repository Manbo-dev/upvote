-- Adds widget customization columns to canais table for PRO+ plan personalization
-- widget_position: where the widget appears on screen (default BOTTOM_RIGHT)
-- widget_title: optional custom header title shown in the widget panel
-- widget_placeholder: optional custom textarea placeholder text
ALTER TABLE canais
    ADD COLUMN IF NOT EXISTS widget_position    VARCHAR(20)  NOT NULL DEFAULT 'BOTTOM_RIGHT',
    ADD COLUMN IF NOT EXISTS widget_title       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS widget_placeholder VARCHAR(200);
