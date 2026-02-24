
import * as fs from 'node:fs';
import path from 'node:path';
import { announcementsData } from './src/lib/data/announcement-data';
import { productCategories } from './src/lib/data/categories-data';
import { allCoupons } from './src/lib/data/coupon-data';
import { loyaltyHistoryData } from './src/lib/data/loyalty-history-data';
import { allOccasions } from './src/lib/data/occasion-data';
import { allOrders } from './src/lib/data/order-data';
import { peakDatesData } from './src/lib/data/peak-date-data';
import { allProducts } from './src/lib/data/product-data';
import { allShippingZones } from './src/lib/data/shipping-zones';
import { allTags } from './src/lib/data/tag-data';
import { testimonials } from './src/lib/data/testimonials-data';
import { userCoupons } from './src/lib/data/user-coupon-data';
import { allUsers } from './src/lib/data/user-data';

const dbData = {
  announcements: announcementsData,
  categories: productCategories,
  coupons: allCoupons,
  loyaltyHistory: loyaltyHistoryData,
  occasions: allOccasions,
  orders: allOrders,
  peakDates: peakDatesData,
  products: allProducts,
  shippingZones: allShippingZones,
  tags: allTags,
  testimonials: testimonials,
  userCoupons: userCoupons,
  users: allUsers,
};

// Convert to JSON with pretty printing
const jsonContent = JSON.stringify(dbData, null, 2);

// Write to db.json in the current directory (root)
import { writeFile } from 'node:fs/promises';

async function main() {
    try {
        await writeFile('db.json', jsonContent, 'utf8');
        console.log('Successfully created db.json');
    } catch (error) {
        console.error('Error creating db.json:', error);
    }
}

main();
