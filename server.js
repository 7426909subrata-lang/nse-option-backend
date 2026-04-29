const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// ----------------------
// Health Check Routes
// ----------------------
app.get("/", (req, res) => {
    res.send("Server working");
});

app.get("/test", (req, res) => {
    res.send("Test OK");
});

// ----------------------
// Option Chain API
// ----------------------
app.get("/option-chain", async (req, res) => {
    try {
        const symbol = "^NSEI"; // NIFTY index

        const headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Connection": "keep-alive"
        };

        // Step 1: Get expiry dates
        const baseResponse = await axios.get(
            `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`,
            { headers }
        );

        const baseResult = baseResponse.data?.optionChain?.result?.[0];

        if (!baseResult || !baseResult.expirationDates?.length) {
            return res.status(500).send("No expiry data from Yahoo");
        }

        const expiry = baseResult.expirationDates[0];

        // Step 2: Get option chain
        const optionResponse = await axios.get(
            `https://query2.finance.yahoo.com/v7/finance/options/${symbol}?date=${expiry}`,
            { headers }
        );

        const optionResult = optionResponse.data?.optionChain?.result?.[0];

        if (!optionResult || !optionResult.options?.length) {
            return res.status(500).send("No option chain data");
        }

        const options = optionResult.options[0];

        const calls = options.calls || [];
        const puts = options.puts || [];

        // Step 3: Map data safely
        const data = calls.map((call, i) => {
            const put = puts[i] || {};

            return {
                strike: call.strike || 0,
                callPrice: call.lastPrice || 0,
                putPrice: put.lastPrice || 0,
                callVolume: call.volume || 0,
                putVolume: put.volume || 0
            };
        });

        res.json(data);

    } catch (err) {
        console.error("Yahoo API Error:", err.message);
        res.status(500).send("Error fetching data");
    }
});

// ----------------------
// Start Server (Render compatible)
// ----------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
