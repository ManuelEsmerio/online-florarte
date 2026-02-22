-- Vista para las ventas mensuales
CREATE OR REPLACE VIEW vw_monthly_sales AS
SELECT
    YEAR(created_at) AS year,
    MONTH(created_at) AS month,
    SUM(total) AS total_sales
FROM orders
WHERE status IN ('delivered', 'shipped', 'processing')
GROUP BY YEAR(created_at), MONTH(created_at);

-- Vista para los nuevos usuarios mensuales
CREATE OR REPLACE VIEW vw_monthly_new_users AS
SELECT
    YEAR(created_at) AS year,
    MONTH(created_at) AS month,
    COUNT(id) AS new_users
FROM users
GROUP BY YEAR(created_at), MONTH(created_at);

-- Vista para los pedidos mensuales
CREATE OR REPLACE VIEW vw_monthly_orders AS
SELECT
    YEAR(created_at) AS year,
    MONTH(created_at) AS month,
    COUNT(id) AS total_orders
FROM orders
GROUP BY YEAR(created_at), MONTH(created_at);

-- Vista para las ventas por categoría del mes actual
CREATE OR REPLACE VIEW vw_monthly_sales_by_category AS
SELECT
    YEAR(o.created_at) AS year,
    MONTH(o.created_at) AS month,
    c.name AS category_name,
    SUM(oi.price * oi.quantity) AS total_sales
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE o.status IN ('delivered', 'shipped', 'processing')
GROUP BY YEAR(o.created_at), MONTH(o.created_at), c.name;

-- Vista para los pedidos más recientes (Top 5)
CREATE OR REPLACE VIEW vw_recent_orders AS
SELECT
    o.id,
    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
    o.total,
    o.status
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
