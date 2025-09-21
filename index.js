require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const StockHistory = require("./models/StockHistory.model");
const { Konnect } = require("./connect");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = `${process.env.MONGODB_URI}`
Konnect(MONGODB_URI);

app.use(cors());
app.use(express.json());

async function saveEndOfDay(dailyData) {
  for (const stock of dailyData) {
    try {
      const existing = await StockHistory.findOne({ symbol: stock.symbol });

      if (!existing) {
        await StockHistory.create({
          symbol: stock.symbol,
          history: [{ ...stock, date: new Date() }]
        });
      } else {
        const lastEntry = existing.history[existing.history.length - 1];
        const today = new Date().toDateString();

        if (!lastEntry || new Date(lastEntry.date).toDateString() !== today) {
          existing.history.push({ ...stock, date: new Date() });
          await existing.save();
        }
      }
    } catch (err) {
      console.error(`Failed to save ${stock.symbol}:`, err.message);
    }
  }
}

cron.schedule("31 15 * * 1-5", async () => {
  try {
    console.log("📦 Fetching end-of-day data...");
    const response = await axios.get(`${process.env.SOURCE_URL}`);
    const data = response.data;
    await saveEndOfDay(data);
    console.log("✅ End-of-day data saved successfully.");
  } catch (err) {
    console.error("❌ Failed to save end-of-day data:", err.message);
  }
}, {
  timezone: "Etc/UTC"
});

app.get("/history", async (req, res) => {
  try {
    const allData = await StockHistory.find({});
    if (!allData || !allData.length) {
      return res.status(404).json({ error: "No stock history found" });
    }

    const formattedData = allData.map(stock => ({
      symbol: stock.symbol,
      history: Array.isArray(stock.history) ? stock.history : []
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Error fetching stock history:", err.message);
    res.status(500).json({ error: "Failed to fetch history", details: err.message });
  }
});
app.get('/history/:symbol',async (req,res)=> {
  const symbol = req.params.symbol;
  const data = await StockHistory.findOne({ symbol })
  if(!data || !data.length) return res.status(404).json({ error: "No stock history found" })
  res.json(data.history)
})
app.get("/save-today", async (req, res) => {
  try {
    const response = await axios.get(`${process.env.SOURCE_URL}`);
    const data = response.data;
    await saveEndOfDay(data);
    res.json({ message: "Data saved successfully for today" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
