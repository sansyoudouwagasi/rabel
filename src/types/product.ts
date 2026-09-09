export interface Product {
  id: string;
  name: string;        // 商品名 (例: 栗まんじゅう)
  price: number;       // 価格 (例: 280)
  volume?: string;     // 内容量 (例: 1個)
  ingredients?: string;// 原材料
  storage?: string;    // 保存方法 (例: 直射日光を避け冷暗所で保存)
  expiry?: string;     // 消費期限 (例: 製造日より3日)
  shopName?: string;   // 店名 (例: 参松堂)
  createdAt: number;
  updatedAt: number;
}
