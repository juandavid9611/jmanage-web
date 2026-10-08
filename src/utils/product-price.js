// Price semantics (shop contract):
//   price     = regular price
//   priceSale = discounted LIVE price, optional. Only valid when 0 < priceSale < price;
//               null / 0 / >= price all mean "no discount" (mirrors the API's read-side rule).

export function getSalePrice(product) {
  const price = Number(product?.price);
  const sale = Number(product?.priceSale);

  if (product?.priceSale == null || !Number.isFinite(sale) || !Number.isFinite(price)) {
    return null;
  }

  return sale > 0 && sale < price ? sale : null;
}

export function hasSalePrice(product) {
  return getSalePrice(product) !== null;
}

// Live unit price: the discounted price when valid, otherwise the regular price.
export function getLivePrice(product) {
  return getSalePrice(product) ?? Number(product?.price ?? 0);
}
