
import { cookies, headers } from 'next/headers';
import CheckoutClientPage, { type CheckoutBootstrapData } from './CheckoutClientPage';

interface CartBootstrapSnapshot {
  items: any[];
  subtotal: number;
  coupon: any | null;
}

interface CheckoutServerPayload {
  bootstrap: CheckoutBootstrapData;
  cartBootstrap: CartBootstrapSnapshot | null;
}

async function preloadCheckoutData(): Promise<CheckoutServerPayload> {
  const cookieHeader = (await cookies()).toString();
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (host ? `${proto}://${host}` : 'http://localhost:9002');

  const requestInit: RequestInit = {
    headers: {
      cookie: cookieHeader,
      'content-type': 'application/json',
    },
    cache: 'no-store',
  };

  const [cartRes, profileRes] = await Promise.all([
    fetch(`${baseUrl}/api/cart`, requestInit),
    fetch(`${baseUrl}/api/users/profile`, requestInit),
  ]);

  let phone = '';
  let addressId = 0;
  let deliveryDate = '';
  let couponCode = '';
  let cartBootstrap: CartBootstrapSnapshot | null = null;

  if (cartRes.ok) {
    const cartJson = await cartRes.json();
    const cartData = cartJson?.data;
    deliveryDate = String(cartData?.deliveryDate ?? '');
    couponCode = String(cartData?.coupon?.code ?? '');
    cartBootstrap = {
      items: Array.isArray(cartData?.items) ? cartData.items : [],
      subtotal: Number(cartData?.subtotal ?? 0),
      coupon: cartData?.coupon ?? null,
    };
  }

  if (profileRes.ok) {
    const profileJson = await profileRes.json();
    const user = profileJson?.data;
    phone = String(user?.phone ?? '');
    const defaultAddress = user?.addresses?.find((address: any) => address?.isDefault)?.id
      ?? user?.addresses?.[0]?.id
      ?? 0;
    addressId = Number(defaultAddress) || 0;
  }

  return {
    bootstrap: {
      phone,
      addressId,
      deliveryDate,
      couponCode,
    },
    cartBootstrap,
  };
}

export default async function CheckoutPage() {
  const { bootstrap, cartBootstrap } = await preloadCheckoutData();
  const cartBootstrapScript = cartBootstrap
    ? `window.__FLORARTE_CART_BOOTSTRAP__=${JSON.stringify(cartBootstrap).replace(/</g, '\\u003c')};`
    : '';

  return (
    <>
      {cartBootstrapScript ? <script dangerouslySetInnerHTML={{ __html: cartBootstrapScript }} /> : null}
      <CheckoutClientPage bootstrap={bootstrap} />
    </>
  );
}
