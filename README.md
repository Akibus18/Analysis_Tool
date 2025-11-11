# Deriv Analysis Terminal - Cyberpunk Edition

**A high-tech, Cyberpunk-themed tool for calculating historical winning probabilities for Deriv/Binary.com contract types.**

This tool connects directly to the Deriv API via WebSocket to fetch historical tick data and runs a detailed analysis to help traders make informed decisions before placing a trade.

## ✨ Features

*   **Cyberpunk Aesthetic:** A visually distinct, dark theme with neon accents (Cyan and Magenta) and a terminal-like interface.
*   **API Connection:** Securely connects using your Deriv API Token.
*   **Historical Data Analysis:** Fetches up to 5000 historical ticks for analysis.
*   **Probability Matrix:** Calculates and displays the historical winning percentage for the following contract types:
    *   **RISE / FALL**
    *   **MATCHES / DIFFERS** (Requires a target digit)
    *   **OVER / UNDER** (Requires a target digit)
    *   **EVEN / ODD**
*   **Digit Distribution:** For digit contracts, it also provides a full distribution of the last digit over the analyzed ticks.

## 🚀 Getting Started

### Prerequisites
*   A modern web browser (Chrome, Firefox, Edge).
*   A Deriv/Binary.com account and a valid **API Token**.

### Deployment (GitHub Pages Ready)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/deriv-analysis-terminal.git
    cd deriv-analysis-terminal
    ```
2.  **Open in Browser:**
    Simply open the `index.html` file in your web browser. No local server or build process is required.
3.  **Connect:**
    Enter your Deriv API Token in the **ACCESS CONTROL** panel and click **CONNECT**.
4.  **Analyze:**
    Select your preferred **MARKET**, **CONTRACT TYPE**, and **TICKS FOR ANALYSIS**, then click **RUN ANALYSIS**.

## ⚠️ Disclaimer

Trading is risky. This tool provides historical probability analysis based on past tick data and is for informational purposes only. Past performance is not indicative of future results. Use at your own risk. Always test on a demo account first.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
