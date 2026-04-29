const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// TEST ROUTE (VERY IMPORTANT)
app.get("/", (req, res) => {
    res.send("Server is working");
});

app.get("/test", (req, res) => {
    res.send("Test route working");
});

const BASE_URL = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";

let cookies = "";

async function getCookies() {
    const response = await axios.get("https://www.nseindia.com", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    cookies = response.headers["set-cookie"]
        .map(c => c.split(";")[0])
        .join("; ");
}

async function fetchData() {
    if (!cookies) await getCookies();

    const response = await axios.get(BASE_URL, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/option-chain",
            "Cookie": cookies
        }
    });

    return response.data;
}

app.get("/option-chain", async (req, res) => {
    try {
        const data = await fetchData();
        res.json(data);
    } catch (err) {
        cookies = "";
        res.status(500).send(err.message);
    }
});

// IMPORTANT PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Running on " + PORT));
