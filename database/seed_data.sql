-- -------------------------------------------------------------
-- Florería Florarte - Script de Datos Iniciales (Seed)
-- -------------------------------------------------------------

USE `florarte_db`;

-- 1. Insertar roles de usuario (si se usara una tabla de roles)
-- Por ahora, el rol es un ENUM en la tabla `users`.

-- 2. Insertar un usuario administrador
-- Contraseña es 'password123' (en un entorno real, debería ser un hash)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_deleted`) VALUES
(1, 'Admin Florarte', 'admin@florarte.com', 'password123', 'admin', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), password=VALUES(password), role=VALUES(role), is_deleted=VALUES(is_deleted);

-- 3. Insertar Zonas de Envío
INSERT INTO `shipping_zones` (`postal_code`, `locality`, `shipping_cost`) VALUES
('46400', 'Tequila Centro', 80.00),
('46403', 'Santo Toribio', 50.00),
('46404', 'El Medineño', 60.00),
('46405', 'Santa Teresa', 70.00),
('45350', 'El Arenal', 100.00),
('45380', 'Amatitán', 80.00),
('46770', 'Magdalena', 120.00),
('46530', 'Hostotipaquillo', 150.00)
ON DUPLICATE KEY UPDATE locality=VALUES(locality), shipping_cost=VALUES(shipping_cost);

-- 4. Insertar Días Festivos/Pico para restricciones
INSERT INTO `peak_days` (`name`, `peak_date`, `is_coupon_restricted`) VALUES
('San Valentín 2024', '2024-02-14', 1),
('Día de las Madres 2024', '2024-05-10', 1),
('San Valentín 2025', '2025-02-14', 1),
('Día de las Madres 2025', '2025-05-10', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_coupon_restricted=VALUES(is_coupon_restricted);

-- 5. Insertar Categorías y Subcategorías
-- Primero, las categorías principales
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `prefix`, `description`, `image_url`) VALUES
(1, NULL, 'Arreglos Florales', 'arreglos', 'ARR', 'Diseños únicos para toda ocasión, elaborados con las flores más frescas.', '/assets/categories/arreglos.webp'),
(3, NULL, 'Plantas', 'plantas', 'PLA', 'Un regalo que perdura. Encuentra orquídeas, suculentas y más plantas de interior.', '/assets/categories/plantas.webp'),
(4, NULL, 'Paquetes y Regalos', 'paquetes', 'PAQ', 'Combina flores con globos, chocolates o peluches para crear el regalo perfecto.', '/assets/categories/paquetes.webp'),
(9, NULL, 'Complementos', 'complemento', 'COM', 'Categoría interna para complementos.', 'https://placehold.co/400x300.png')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), prefix=VALUES(prefix), description=VALUES(description), image_url=VALUES(image_url), parent_id=VALUES(parent_id);

-- Luego, las subcategorías, referenciando los IDs de las principales
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `prefix`, `description`, `image_url`) VALUES
(2, 1, 'Ramos Buchones', 'ramos', 'RAM', 'Impresionantes ramos que nunca pasan desapercibidos.', '/assets/categories/ramos.webp'),
(10, 1, 'Flores Exóticas', 'flores-exoticas', 'EXO', 'Descubre arreglos únicos con flores exóticas.', 'https://placehold.co/400x300.png'),
(5, 4, 'Globos', 'globos', 'GLO', 'Añade un toque de celebración a tu regalo.', '/assets/categories/globos.webp'),
(6, 4, 'Chocolates y Dulces', 'chocolates', 'CHO', 'Endulza su día con nuestra variedad de chocolates y dulces.', '/assets/categories/chocolates.webp'),
(7, 4, 'Peluches', 'peluches', 'PEL', 'Un compañero suave y tierno para acompañar tus flores.', '/assets/categories/peluches.webp'),
(8, 4, 'Pasteles', 'pastel', 'PAS', 'Celebra con un delicioso pastel.', 'https://placehold.co/400x300.png')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), prefix=VALUES(prefix), description=VALUES(description), image_url=VALUES(image_url), parent_id=VALUES(parent_id);

-- 6. Insertar Ocasiones
INSERT INTO `occasions` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Cumpleaños', 'cumpleanos', 'Arreglos y regalos perfectos para celebrar un año más de vida.'),
(2, 'Aniversario', 'aniversario', 'Demuestra tu amor y celebra un año más juntos.'),
(3, 'Amor y Romance', 'amor', 'Expresa tus sentimientos más profundos con flores.'),
(4, 'Agradecimiento', 'gracias', 'Una hermosa manera de decir "gracias".'),
(5, 'Recupérate Pronto', 'recuperate', 'Envía buenos deseos y una pronta recuperación.'),
(6, 'Nacimiento', 'nacimiento', 'Celebra la llegada de un nuevo miembro a la familia.'),
(7, 'Condolencias', 'condolencias', 'Expresa tu pésame y solidaridad en momentos difíciles.'),
(8, 'Graduación', 'graduacion', 'Felicita a los graduados por su gran logro.'),
(9, 'Inauguración', 'inauguracion', 'Desea éxito y prosperidad en un nuevo comienzo.'),
(10, 'Día de las Madres', 'dia-de-madres', 'El detalle perfecto para la mujer más importante.')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description);

-- 7. Insertar Etiquetas (Tags)
INSERT INTO `tags` (`id`, `name`) VALUES
(1, 'más vendido'),
(2, 'amor'),
(3, 'aniversario'),
(4, 'girasoles'),
(5, 'alegría'),
(6, 'cumpleaños'),
(7, 'lujo'),
(8, 'moderno'),
(9, 'buchón'),
(10, 'tulipanes'),
(11, 'canasta'),
(12, 'fresco'),
(13, 'exótico'),
(14, 'tropical'),
(15, 'anturios')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- -------------------------------------------------------------
-- Nota: Los datos de productos, pedidos, etc., son más
-- transaccionales y generalmente no se incluyen en un
-- script de seed básico, pero podrían añadirse aquí
-- para fines de prueba.
-- -------------------------------------------------------------

-- FIN DEL SCRIPT DE DATOS INICIALES --
