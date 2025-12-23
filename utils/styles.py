import streamlit as st

def apply_custom_style():
    st.markdown("""
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');

            /* Global Settings */
            html, body, [class*="css"]  {
                font-family: 'Outfit', sans-serif;
                background-color: #f8f9fa;
                color: #1a1a1a;
            }
            
            /* Background Texture/Pattern */
            .stApp {
                background-color: #f8f9fa;
                background-image: radial-gradient(#ee2a2408 1px, transparent 1px);
                background-size: 20px 20px;
            }

            /* Header/Navbar Styling */
            header[data-testid="stHeader"] {
                background-color: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid #eee;
            }

            /* LaLiga Red Typography */
            h1, h2, h3 {
                color: #ee2a24 !important;
                font-weight: 800;
                letter-spacing: -1px;
                text-transform: uppercase;
                margin-bottom: 0.5rem;
            }

            /* Sidebar - Dark Sporty Look */
            section[data-testid="stSidebar"] {
                background-color: #1a1a1b !important;
                border-right: 1px solid #333;
            }
            section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p,
            section[data-testid="stSidebar"] [data-testid="stWidgetLabel"] p {
                color: #ecf0f1 !important;
            }
            section[data-testid="stSidebar"] hr {
                border-top: 1px solid #333 !important;
            }
            
            /* Sidebar Navigation Links */
            [data-testid="stSidebarNav"] {
                background-color: transparent !important;
            }
            [data-testid="stSidebar"] a {
                color: #bdc3c7 !important;
                font-weight: 600 !important;
                text-decoration: none !important;
            }
            [data-testid="stSidebar"] a:hover {
                color: #ee2a24 !important;
                background-color: rgba(255,255,255,0.05) !important;
            }
            [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] {
                background-color: transparent !important;
                border: 1px solid transparent;
            }
            [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"]:hover {
                border-color: #ee2a2433;
                background-color: #ffffff0a !important;
            }

            /* Custom Page Link Labels for Sidebar */
            [data-testid="stSidebar"] .st-emotion-cache-1ky2y96 {
                color: white !important;
            }
            /* Metric Cards (Premium Sports Look) */
            [data-testid="stMetric"] {
                background: white;
                border: 1px solid #eef0f2;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                border-left: 5px solid #ee2a24;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            [data-testid="stMetric"]:hover {
                transform: scale(1.02);
                box-shadow: 0 12px 30px rgba(238, 42, 36, 0.08);
            }
            [data-testid="stMetricLabel"] {
                color: #7f8c8d;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 0.7rem;
                letter-spacing: 1px;
            }
            [data-testid="stMetricValue"] {
                color: #1a1a1b;
                font-weight: 800;
                font-size: 1.8rem;
            }

            /* Custom Leaderboard HTML Styling */
            .leaderboard-container {
                background: white;
                border-radius: 20px;
                padding: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                border: 1px solid #f0f0f0;
                width: 100%;
            }
            .leaderboard-table {
                width: 100%;
                border-collapse: collapse;
            }
            .leaderboard-header {
                font-weight: 800;
                color: #7f8c8d;
                text-transform: uppercase;
                font-size: 0.75rem;
                letter-spacing: 1px;
                padding: 20px;
                border-bottom: 2px solid #f8f9fa;
                text-align: left;
            }
            .player-row {
                transition: background 0.2s;
            }
            .player-row:hover {
                background-color: #fff9f9;
            }
            .player-cell {
                padding: 18px 20px;
                border-bottom: 1px solid #f8f9fa;
                font-weight: 600;
                color: #2c3e50;
            }
            .rank-badge {
                width: 32px;
                height: 32px;
                background: #f8f9fa;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                color: #1a1a1b;
                font-size: 0.85rem;
            }
            .rank-1 .rank-badge { background: #ffca28; color: white; }
            .rank-2 .rank-badge { background: #b0bec5; color: white; }
            .rank-3 .rank-badge { background: #ff8a65; color: white; }
            
            .player-name {
                font-weight: 700;
                font-size: 1rem;
                color: #1a1a1b;
            }
            .pts-high {
                color: #ee2a24;
                font-weight: 800;
            }

            /* Tab Styling (Professional) */
            .stTabs {
                margin: 0 20px;
            }
            .stTabs [data-baseweb="tab-list"] {
                gap: 20px;
                background-color: #f1f3f5;
                padding: 8px 16px;
                border-radius: 12px;
            }
            .stTabs [data-baseweb="tab"] {
                height: 40px;
                padding: 0 24px;
                white-space: pre-wrap;
                background-color: transparent;
                border-radius: 8px;
                color: #7f8c8d;
                font-weight: 700;
                border: none;
                transition: all 0.2s;
            }
            .stTabs [aria-selected="true"] {
                background-color: white !important;
                color: #ee2a24 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }

            /* Buttons - LaLiga Red Gradient */
            .stButton > button {
                background: linear-gradient(135deg, #ee2a24 0%, #c1221c 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 700;
                padding: 10px 30px;
                text-transform: uppercase;
                transition: all 0.3s ease;
            }
            .stButton > button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(238, 42, 36, 0.3);
                color: white;
            }

            /* Badge/Chip for Matchday */
            .matchday-badge {
                background: #ee2a24;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: 800;
                vertical-align: middle;
                margin-left: 10px;
            }
            
            /* Footer */
            .custom-footer {
                text-align: center;
                padding: 40px 20px;
                color: #bdc3c7;
                font-size: 0.8rem;
                border-top: 1px solid #eee;
                margin-top: 50px;
            }
        </style>
    """, unsafe_allow_html=True)
