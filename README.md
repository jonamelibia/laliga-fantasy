# ⚽ LALIGA Fantasy | Premium Stats Dashboard

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://myfantasy.streamlit.app/)
![LALIGA Logo](https://fantasy.laliga.com/assets/images/logo_fantasy.png)

A high-performance, premium-designed Streamlit dashboard for our **Amigos Fantasy League**. This project transforms our player data into a professional sports broadcasting experience, featuring advanced analytics, real-time standings, and automated fine tracking for our group.

**🚀 Live Application:** [myfantasy.streamlit.app](https://myfantasy.streamlit.app/)

## ✨ Features

- **🏆 Custom Leaderboard**: A bespoke HTML/CSS classification table with rank badges and sports-grade typography.
- **🛡️ Safety Analytics**: Unique "Media Seguridad" metric that calculates the average points needed to avoid fines (3rd place threshold).
- **📉 Advanced Visualization Tabs**:
  - **Evolution**: Historical and cumulative points tracking.
  - **Positions**: Dynamic rank history across all matchdays.
  - **Sanctions**: Full-width cumulative fines time-series.
  - **Consistency**: Boxplot distributions to analyze player stability.
- **🎨 Premium UI/UX**:
  - **LaLiga Light Theme**: Crisp off-white background with official Red/Coral accents.
  - **Dark Sidebar**: Professional high-contrast navigation.
  - **Glassmorphism**: Elegant card components with subtle blur and shadow effects.

## 🛠️ Technology Stack

- **Frontend**: [Streamlit](https://streamlit.io/) (Python-based interactive UI)
- **Data Engine**: [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/)
- **Visuals**: [Plotly Express](https://plotly.com/python/plotly-express/)
- **Storage**: Google Sheets Integration (via `gspread`)
- **Styling**: Custom CSS Injection (Vanilla CSS)

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Google Cloud Service Account (for Sheets API)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/laliga-fantasy.git
   cd laliga-fantasy
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Secrets**:
   Create a `.streamlit/secrets.toml` file with your credentials:
   ```toml
   APP_PASSWORD = "your-password"
   
   [gcp_service_account]
   type = "service_account"
   project_id = "..."
   ...
   ```

4. **Run the Dashboard**:
   ```bash
   streamlit run Inicio.py
   ```

## 📸 Dashboard Preview

![Header Section](file:///Users/jonamelibia/.gemini/antigravity/brain/b1810a63-7be8-4754-956b-cd091deecb3c/sidebar_and_headers_verification_1766482044031.png)

---
*Created with ❤️ for the Genuines - Amigos Fantasy League.*
