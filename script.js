/* ===== DERIV ANALYSIS TERMINAL - CYBERPUNK EDITION ===== */

document.addEventListener("DOMContentLoaded", () => {
    // --- Constants ---
    const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";
    const MAX_TICKS = 5000;

    // --- State ---
    let ws = null;
    let token = "";
    let accountId = "SYSTEM OFFLINE";
    let isConnected = false;
    let tickHistory = [];

    // --- DOM Elements ---
    const tokenInput = document.getElementById("token");
    const connectBtn = document.getElementById("btnConnect");
    const statusSpan = document.getElementById("connStatus");
    const accountIdSpan = document.getElementById("accountId");
    const marketSelect = document.getElementById("marketSelect");
    const contractTypeSelect = document.getElementById("contractType");
    const digitRow = document.getElementById("digitRow");
    const targetDigitInput = document.getElementById("targetDigit");
    const tickCountInput = document.getElementById("tickCount");
    const analyzeBtn = document.getElementById("btnAnalyze");
    const resultsMatrix = document.getElementById("resultsMatrix");
    const logBox = document.getElementById("logBox");

    // --- Utility Functions ---
    const log = (message, type = "info") => {
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `[${time}] ${message}`;
        logBox.prepend(entry);
    };

    const updateConnectionStatus = (connected) => {
        isConnected = connected;
        if (connected) {
            statusSpan.textContent = "ONLINE";
            statusSpan.classList.add("connected");
            statusSpan.classList.remove("disconnected");
            accountIdSpan.textContent = accountId;
            analyzeBtn.disabled = false;
        } else {
            statusSpan.textContent = "OFFLINE";
            statusSpan.classList.remove("connected");
            statusSpan.classList.add("disconnected");
            accountIdSpan.textContent = "SYSTEM OFFLINE";
            analyzeBtn.disabled = true;
        }
    };

    const send = (data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            log("WebSocket is not open. Please connect first.", "error");
        }
    };

    // --- WebSocket Handlers ---
    const connect = () => {
        if (ws) {
            ws.close();
        }
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            log("WebSocket connection established. Requesting authorization...", "info");
            send({ authorize: token });
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) {
                log(`API Error: ${data.error.message}`, "error");
                updateConnectionStatus(false);
                return;
            }

            switch (data.msg_type) {
                case "authorize":
                    handleAuthorize(data);
                    break;
                case "history":
                    handleHistory(data);
                    break;
                case "ping":
                    // Connection kept alive, no action needed
                    break;
                default:
                    // Ignore other messages
                    break;
            }
        };

        ws.onclose = () => {
            log("WebSocket connection closed.", "error");
            updateConnectionStatus(false);
        };

        ws.onerror = (err) => {
            log(`WebSocket error: ${err.message}`, "error");
        };
    };

    const handleAuthorize = (data) => {
        if (data.authorize && data.authorize.loginid) {
            accountId = `${data.authorize.loginid} (${data.authorize.currency})`;
            log(`Authorization successful. Account: ${accountId}`, "success");
            updateConnectionStatus(true);

            // Send a ping request to keep the connection alive
            send({ ping: 1 });

            // Check for pending analysis request
            if (analyzeBtn.dataset.pendingAnalysis === 'true') {
                analyzeBtn.dataset.pendingAnalysis = 'false';
                resultsMatrix.innerHTML = '<p class="placeholder">Authorization successful. Fetching data...</p>';
                requestHistory();
            }
        } else {
            log("Authorization failed. Check your API token.", "error");
            updateConnectionStatus(false);
        }
    };

    const handleHistory = (data) => {
        if (data.history && data.history.prices) {
            tickHistory = data.history.prices.map(price => parseFloat(price));
            log(`Received ${tickHistory.length} ticks for analysis.`, "success");
            runAnalysis();
        } else {
            log("Failed to retrieve tick history.", "error");
        }
    };

    // --- Analysis Functions ---

    /**
     * Calculates the probability of a contract type winning based on historical data.
     * @param {string} type - The contract type (RISE_FALL, MATCHES_DIFFERS, etc.)
     * @param {number} [digit] - The target digit for digit contracts.
     * @returns {object} { win: number, loss: number }
     */
    const calculateProbability = (type, digit = null) => {
        if (tickHistory.length === 0) return { win: 0, loss: 0 };

        let winCount = 0;
        let totalCount = tickHistory.length - 1; // Need at least two ticks for a change

        // Get the last digit of each tick
        const lastDigits = tickHistory.map(price => price.toFixed(2).slice(-1)).map(d => parseInt(d));

        for (let i = 1; i < tickHistory.length; i++) {
            const prevPrice = tickHistory[i - 1];
            const currentPrice = tickHistory[i];
            const currentDigit = lastDigits[i];

            let isWin = false;

            switch (type) {
                case "RISE_FALL":
                    // Simple analysis: did the price rise or fall from the previous tick?
                    // This is a proxy for the actual contract which is based on a future tick,
                    // but it gives a historical probability of price movement.
                    if (currentPrice > prevPrice) {
                        // Rise
                        isWin = true;
                    } else if (currentPrice < prevPrice) {
                        // Fall
                        isWin = false;
                    } else {
                        // No change, ignore this tick for this analysis
                        totalCount--;
                        continue;
                    }
                    break;

                case "MATCHES_DIFFERS":
                    if (digit === null) {
                        log("Target digit is required for MATCHES/DIFFERS analysis.", "error");
                        return { win: 0, loss: 0 };
                    }
                    // Matches: last digit matches the target digit
                    if (currentDigit === digit) {
                        isWin = true;
                    } else {
                        isWin = false;
                    }
                    break;

                case "OVER_UNDER":
                    if (digit === null) {
                        log("Target digit is required for OVER/UNDER analysis.", "error");
                        return { win: 0, loss: 0 };
                    }
                    // Over: last digit is greater than the target digit
                    if (currentDigit > digit) {
                        isWin = true;
                    } else {
                        isWin = false;
                    }
                    break;

                case "EVEN_ODD":
                    // Even: last digit is even (0, 2, 4, 6, 8)
                    if (currentDigit % 2 === 0) {
                        isWin = true;
                    } else {
                        isWin = false;
                    }
                    break;
            }

            if (isWin) {
                winCount++;
            }
        }

        if (totalCount === 0) return { win: 0, loss: 0 };

        const winProbability = (winCount / totalCount) * 100;
        const lossProbability = 100 - winProbability;

        return { win: winProbability, loss: lossProbability };
    };

    // --- Main Logic ---

    const requestHistory = () => {
        const symbol = marketSelect.value;
        const count = parseInt(tickCountInput.value);

        log(`Requesting ${count} ticks for ${symbol}...`, "info");

        // Request historical data
        send({
            ticks_history: symbol,
            end: "latest",
            count: count,
            subscribe: 0,
            style: "ticks"
        });
    };

    const runAnalysis = () => {
        resultsMatrix.innerHTML = "";
        const contractType = contractTypeSelect.value;
        const targetDigit = parseInt(targetDigitInput.value);

        log(`Starting analysis for ${contractType} on ${marketSelect.value}...`, "warn");

        switch (contractType) {
            case "RISE_FALL":
                // RISE/FALL analysis
                const riseFallProb = calculateProbability("RISE_FALL");
                displayResult("RISE", riseFallProb.win, "FALL", riseFallProb.loss);
                break;

            case "MATCHES_DIFFERS":
                // MATCHES/DIFFERS analysis
                const matchesDiffersProb = calculateProbability("MATCHES_DIFFERS", targetDigit);
                displayResult(`MATCHES ${targetDigit}`, matchesDiffersProb.win, `DIFFERS ${targetDigit}`, matchesDiffersProb.loss);
                break;

            case "OVER_UNDER":
                // OVER/UNDER analysis
                const overUnderProb = calculateProbability("OVER_UNDER", targetDigit);
                displayResult(`OVER ${targetDigit}`, overUnderProb.win, `UNDER ${targetDigit}`, overUnderProb.loss);
                break;

            case "EVEN_ODD":
                // EVEN/ODD analysis
                const evenOddProb = calculateProbability("EVEN_ODD");
                displayResult("EVEN", evenOddProb.win, "ODD", evenOddProb.loss);
                break;
        }

        // For digit contracts, also show the probability for all 10 digits (0-9)
        if (contractType === "MATCHES_DIFFERS" || contractType === "OVER_UNDER" || contractType === "EVEN_ODD") {
            displayDigitDistribution();
        }

        log("Analysis complete.", "success");
    };

    const displayResult = (winLabel, winProb, lossLabel, lossProb) => {
        const resultDiv = document.createElement("div");
        resultDiv.className = "analysis-result";
        resultDiv.innerHTML = `
            <div class="result-header">${winLabel} vs ${lossLabel} Probability</div>
            <div class="result-data">
                <span class="win-prob">${winLabel}: ${winProb.toFixed(2)}%</span>
                <span class="loss-prob">${lossLabel}: ${lossProb.toFixed(2)}%</span>
            </div>
        `;
        resultsMatrix.appendChild(resultDiv);
    };

    const displayDigitDistribution = () => {
        const digitCounts = Array(10).fill(0);
        const lastDigits = tickHistory.map(price => price.toFixed(2).slice(-1)).map(d => parseInt(d));
        const totalDigits = lastDigits.length;

        lastDigits.forEach(digit => {
            if (digit >= 0 && digit <= 9) {
                digitCounts[digit]++;
            }
        });

        const distributionDiv = document.createElement("div");
        distributionDiv.className = "analysis-result";
        distributionDiv.innerHTML = `<div class="result-header">Last Digit Distribution (Total Ticks: ${totalDigits})</div>`;

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.fontFamily = "var(--font-main)";
        table.style.fontSize = "0.9rem";
        table.style.color = "var(--text)";
        table.innerHTML = `
            <thead>
                <tr>
                    ${Array.from({ length: 10 }, (_, i) => `<th>${i}</th>`).join('')}
                </tr>
            </thead>
            <tbody id="digitDistributionBody"></tbody>
        `;
        distributionDiv.appendChild(table);
        resultsMatrix.appendChild(distributionDiv);

        const body = document.getElementById("digitDistributionBody");
        const row = body.insertRow();

        digitCounts.forEach((count, digit) => {
            const percentage = (count / totalDigits) * 100;
            const cell = row.insertCell();
            cell.innerHTML = `${percentage.toFixed(1)}%`;
            cell.style.color = percentage > 10 ? "var(--success)" : "var(--danger)";
            cell.style.textAlign = "center";
        });
    };

    // --- Event Listeners ---

    connectBtn.addEventListener("click", () => {
        token = tokenInput.value.trim();
        if (token) {
            connect();
        } else {
            log("Please enter your Deriv API Token.", "error");
        }
    });

    analyzeBtn.addEventListener("click", () => {
        if (isConnected) {
            resultsMatrix.innerHTML = '<p class="placeholder">Analyzing data... Please wait.</p>';
            requestHistory();
        } else {
            log("Connection lost or not established. Reconnecting and authorizing...", "warn");
            // Store the intent to analyze and reconnect
            analyzeBtn.dataset.pendingAnalysis = 'true';
            connect();
        }
    });

    contractTypeSelect.addEventListener("change", (e) => {
        const type = e.target.value;
        if (type === "MATCHES_DIFFERS" || type === "OVER_UNDER") {
            digitRow.style.display = "flex";
        } else {
            digitRow.style.display = "none";
        }
    });

    // Initial setup
    updateConnectionStatus(false);
    contractTypeSelect.dispatchEvent(new Event('change')); // Trigger initial display check
});
