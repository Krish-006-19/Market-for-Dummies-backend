const mongoose = require("mongoose");

const StockHistorySchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  history: [
    {
      ltp: Number,
      change: Number,
      percentChange: Number,
      open: Number,
      high: Number,
      low: Number,
      prevClose: Number,
      volume: Number,
      marketCap: Number,
      date: { type: Date, default: Date.now } 
    }
  ]
});

module.exports = mongoose.model("StockHistory", StockHistorySchema);