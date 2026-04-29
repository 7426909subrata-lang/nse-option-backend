const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const BASE_URL = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";

let cookies = "";

// ✅ Health check routes
app.get("/", (req, res) => {
    res.send("Server is working");
});

app.get("/test", (req, res) => {
    res.send("Test route working");
});

// ✅ Get fresh cookies from NSE
async function getCookies() {
    try {
        const response = await axios.get("https://www.nseindia.com", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        cookies = response.headers["set-cookie"]
            .map(c => c.split(";")[0])
            .join("; ");

    } catch (err) {
        console.error("Cookie fetch error:", err.message);
    }
}

// ✅ Fetch NSE data with retry logic
async function fetchData(retry = true) {
    try {
        if (!cookies) await getCookies();

        const response = await axios.get(BASE_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.nseindia.com/option-chain",
                "Connection": "keep-alive",
                "Cookie": cookies
            },
            timeout: 10000
        });

        return response.data;

    } catch (err) {
        console.error("Fetch error:", err.response?.status || err.message);

        // 🔁 Retry once if blocked
        if (retry) {
            cookies = "";
            await getCookies();
            return fetchData(false);
        }

        throw err;
    }
}

// ✅ Main API route
app.get("/option-chain", async (req, res) => {
    try {
        const data = await fetchData();
        res.json(data);
    } catch (err) {
        res.status(500).send("Failed to fetch NSE data");
    }
});

// ✅ Correct port for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
