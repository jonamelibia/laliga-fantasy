import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd

# --- Configuración ---
APP_PASSWORD = st.secrets["app"]["password"]

# --- Configuración Google Sheets ---
gs_config = st.secrets["google_sheets"]

credentials = {
    "type": "service_account",
    "project_id": gs_config["google_project_id"],
    "private_key_id": gs_config["google_private_key_id"],
    "private_key": gs_config["google_private_key"].replace("\\n", "\n"),
    "client_email": gs_config["google_client_email"],
    "client_id": gs_config["google_client_id"],
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{gs_config['google_client_email']}"
}

scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

@st.cache_data
def obtener_datos(refresh=False):
    creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials, scope)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(gs_config["google_spreadsheet_id"]).sheet1
    datos_actualizados = sheet.get_all_records()
    df_final = pd.DataFrame(datos_actualizados)
    return df_final

