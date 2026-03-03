-- CreateIndex
CREATE INDEX `orders_userId_createdAt_idx` ON `orders`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `orders_status_createdAt_idx` ON `orders`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `orders_deliveryDate_status_idx` ON `orders`(`deliveryDate`, `status`);

-- CreateIndex
CREATE INDEX `products_status_isDeleted_idx` ON `products`(`status`, `isDeleted`);

-- CreateIndex
CREATE INDEX `products_categoryId_status_isDeleted_idx` ON `products`(`categoryId`, `status`, `isDeleted`);

-- CreateIndex
CREATE INDEX `products_createdAt_idx` ON `products`(`createdAt`);
