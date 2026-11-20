const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

admin.initializeApp();
const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// SANDBOX FIRST - change to false when you go live
const SANDBOX = true;
const CLIENT_ID = SANDBOX ? process.env.RELOADLY_SANDBOX_ID : process.env.RELOADLY_LIVE_ID;
const CLIENT_SECRET = SANDBOX ? process.env.RELOADLY_SANDBOX_SECRET : process.env.RELOADLY_LIVE_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch("https://auth.reloadly.com/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      audience: "https://topups.reloadly.com"
    })
  });
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function reloadlyGet(base, path) {
  const token = await getToken();
  const res = await fetch(base + path, {
    headers: {"Authorization": "Bearer " + token, "Accept": "application/json"}
  });
  return res.json();
}

async function reloadlyPost(base, path, body) {
  const token = await getToken();
  const res = await fetch(base + path, {
    method: "POST",
    headers: {"Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json"},
    body: JSON.stringify(body)
  });
  return res.json();
}

const TOPUP_BASE = SANDBOX ? "https://topups.reloadly.com" : "https://topups.reloadly.com";
const DATA_BASE = "https://data.reloadly.com";
const GIFT_BASE = "https://giftcards.reloadly.com";
const ESIM_BASE = "https://esim.reloadly.com";
const CARD_BASE = "https://prepaid-cards.reloadly.com";

// 1. OPERATOR - Airtime check by phone
app.get("/api/reloadly/operator", async (req, res) => {
  try {
    const phone = req.query.phone;
    const data = await reloadlyGet(TOPUP_BASE, `/v1/operators/auto-detect/phone/${encodeURIComponent(phone)}?includeData=false&includePin=false`);
    res.json(data);
  } catch(e){ res.status(500).json({error: e.message}); }
});

// 2. BUNDLES - Data bundle by phone
app.get("/api/reloadly/bundles", async (req, res) => {
  try {
    const phone = req.query.phone;
    const data = await reloadlyGet(TOPUP_BASE, `/v1/operators/auto-detect/phone/${encodeURIComponent(phone)}?includeData=true&includePin=false`);
    // Reloadly returns operator with data bundles inside
    const bundles = data.dataBundles || data.bundles || [data];
    res.json(Array.isArray(bundles) ? bundles : [bundles]);
  } catch(e){ res.status(500).json({error: e.message}); }
});

// 3. GIFTCARDS
app.get("/api/reloadly/giftcards", async (req, res) => {
  try {
    const country = req.query.country || "GH";
    const search = req.query.search || "";
    const codeMap = {Ghana:"GH", Nigeria:"NG", "United Kingdom":"GB", "United States":"US", All:""};
    const cc = codeMap[country] || country;
    let path = `/v1/products?size=50`;
    if (cc) path += `&countryCode=${cc}`;
    if (search) path += `&name=${encodeURIComponent(search)}`;
    const data = await reloadlyGet(GIFT_BASE, path);
    res.json(data.content || data || []);
  } catch(e){ res.status(500).json({error: e.message}); }
});

// 4. eSIM
app.get("/api/reloadly/esim", async (req, res) => {
  try {
    const region = req.query.region || "Europe";
    const data = await reloadlyGet(ESIM_BASE, `/v1/plans?size=20&region=${encodeURIComponent(region)}`);
    res.json(data.content || data || []);
  } catch(e){ res.status(500).json({error: e.message}); }
});

// 5. PREPAID VIRTUAL CARDS (Swype)
app.get("/api/reloadly/prepaid-cards", async (req, res) => {
  try {
    const amount = req.query.amount || 10;
    const data = await reloadlyGet(CARD_BASE, `/v1/products?size=20`);
    res.json(data.content || data || []);
  } catch(e){ res.status(500).json({error: e.message}); }
});

// BUY - Airtime/Data Topup (use after user pay wallet)
app.post("/api/reloadly/topup", async (req, res) => {
  try {
    const {operatorId, amount, phone, email} = req.body;
    const data = await reloadlyPost(TOPUP_BASE, "/v1/topups", {
      operatorId: parseInt(operatorId),
      useLocalAmount: false,
      amount: parseFloat(amount),
      recipientEmail: email || "user@kratisdata.com",
      recipientPhone: {countryCode: phone.substring(0,4), number: phone.substring(4)},
      referenceId: "KRATIS-" + Date.now()
    });
    res.json(data);
  } catch(e){ res.status(500).json({error: e.message}); }
});

exports.api = functions.https.onRequest(app);
