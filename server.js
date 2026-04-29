const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Health routes
app.get("/", (req, res) => res.send("Server working"));
app.get("/test", (req, res) => res.send("Test OK"));

// Yahoo Finance option chain
app.get("/option-chain", async (req, res) => {
    try {
        // NIFTY Yahoo symbol
        const symbol = "^NSEI";

        // Get expiration dates first
        const base = await axios.get(
            `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`
        );

        const expiration = base.data.optionChain.result[0].expirationDates[0];

        // Fetch option chain for nearest expiry
        const response = await axios.get(
            `https://query2.finance.yahoo.com/v7/finance/options/${symbol}?date=${expiration}`
        );

        const options = response.data.optionChain.result[0].options[0];

        // Extract clean data
        const data = options.calls.map((call, i) => {
            const put = options.puts[i] || {};

            return {
                strike: call.strike,
                callPrice: call.lastPrice,
                putPrice: put.lastPrice,
                callVolume: call.volume || 0,
                putVolume: put.volume || 0
            };
        });

        res.json(data);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error fetching data");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
